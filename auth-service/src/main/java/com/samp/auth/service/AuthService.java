package com.samp.auth.service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import com.samp.auth.AuthModels.LoginRequest;
import com.samp.auth.AuthModels.LoginResponse;
import com.samp.auth.AuthModels.LogoutResponse;
import com.samp.auth.AuthModels.MfaVerifyRequest;
import com.samp.auth.AuthModels.RefreshRequest;
import com.samp.auth.AuthModels.RegisterRequest;
import com.samp.auth.AuthModels.RegisterResponse;
import com.samp.auth.AuthModels.TokenResponse;
import com.samp.auth.domain.RefreshToken;
import com.samp.auth.domain.UserAccount;
import com.samp.auth.repository.RefreshTokenRepository;
import com.samp.auth.repository.UserAccountRepository;
import com.samp.auth.service.JwtTokenService.IssuedToken;
import com.samp.auth.service.JwtTokenService.TokenClaims;
import com.samp.audit.service.AuditEvent;
import com.samp.audit.service.AuditLogService;
import com.samp.audit.service.RequestMetadata;
import com.samp.audit.service.RequestMetadataResolver;
import com.samp.tenant.domain.Tenant;
import com.samp.tenant.service.TenantService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final TotpService totpService;
    private final TokenHashService tokenHashService;
    private final TenantService tenantService;
    private final AuditLogService auditLogService;
    private final RequestMetadataResolver requestMetadataResolver;

    public AuthService(
        UserAccountRepository userAccountRepository,
        RefreshTokenRepository refreshTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenService jwtTokenService,
        TotpService totpService,
        TokenHashService tokenHashService,
        TenantService tenantService,
        AuditLogService auditLogService,
        RequestMetadataResolver requestMetadataResolver
    ) {
        this.userAccountRepository = userAccountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.totpService = totpService;
        this.tokenHashService = tokenHashService;
        this.tenantService = tenantService;
        this.auditLogService = auditLogService;
        this.requestMetadataResolver = requestMetadataResolver;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        RequestMetadata metadata = requestMetadataResolver.current();
        try {
            Tenant tenant = tenantService.requireActiveTenant(request.tenantId());
            String normalizedEmail = normalizeEmail(request.email());
            if (userAccountRepository.existsByEmailAndTenant_Id(normalizedEmail, tenant.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists for this tenant");
            }

            boolean mfaEnabled = request.mfaEnabled() == null || request.mfaEnabled();
            UserAccount userAccount = new UserAccount();
            userAccount.setTenant(tenant);
            userAccount.setEmail(normalizedEmail);
            userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
            userAccount.setMfaEnabled(mfaEnabled);
            userAccount.setTotpSecret(mfaEnabled ? totpService.generateSecret() : null);
            userAccount.setActive(true);

            UserAccount savedUser = userAccountRepository.save(userAccount);
            audit("AUTH_REGISTER", "CREATE", "SUCCESS", savedUser.getId(), tenant.getId(), null, metadata, "User registration completed");
            return new RegisterResponse(
                tenant.getId(),
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.isMfaEnabled(),
                savedUser.getTotpSecret(),
                savedUser.isMfaEnabled() ? totpService.provisioningUri(savedUser.getEmail(), savedUser.getTotpSecret()) : null,
                savedUser.getCreatedAt()
            );
        } catch (ResponseStatusException exception) {
            audit("AUTH_REGISTER", "CREATE", "FAILURE", null, request.tenantId(), null, metadata, exception.getReason());
            throw exception;
        }
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        RequestMetadata metadata = requestMetadataResolver.current();
        try {
            UserAccount userAccount = findActiveUserByEmailAndTenantId(request.email(), request.tenantId());
            if (!passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
            }

            if (userAccount.isMfaEnabled()) {
                IssuedToken challengeToken = jwtTokenService.issueMfaChallengeToken(userAccount);
                audit("AUTH_LOGIN", "AUTHENTICATE", "MFA_REQUIRED", userAccount.getId(), userAccount.getTenant().getId(), null, metadata, "Primary authentication succeeded, MFA required");
                return new LoginResponse(true, challengeToken.token(), challengeToken.expiresAt(), null);
            }

            userAccount.setLastLoginAt(OffsetDateTime.now());
            TokenResponse tokens = issueTokens(userAccount);
            audit("AUTH_LOGIN", "AUTHENTICATE", "SUCCESS", userAccount.getId(), userAccount.getTenant().getId(), null, metadata, "Login completed");
            return new LoginResponse(false, null, null, tokens);
        } catch (ResponseStatusException exception) {
            audit("AUTH_LOGIN", "AUTHENTICATE", "FAILURE", null, request.tenantId(), null, metadata, exception.getReason());
            throw exception;
        }
    }

    @Transactional
    public TokenResponse verifyMfa(MfaVerifyRequest request) {
        RequestMetadata metadata = requestMetadataResolver.current();
        try {
            TokenClaims claims = parseToken(
                request.challengeToken(),
                JwtTokenType.MFA_CHALLENGE,
                "MFA challenge token is invalid or expired"
            );
            tenantService.requireActiveTenant(claims.tenantId());
            UserAccount userAccount = findActiveUserById(claims.subject());
            if (!userAccount.getTenant().getId().equals(claims.tenantId())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "MFA challenge token tenant mismatch");
            }
            if (!userAccount.isMfaEnabled() || userAccount.getTotpSecret() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MFA is not configured for this account");
            }
            if (!totpService.verifyCode(userAccount.getTotpSecret(), request.code())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid MFA code");
            }

            userAccount.setLastLoginAt(OffsetDateTime.now());
            TokenResponse tokens = issueTokens(userAccount);
            audit("AUTH_MFA_VERIFY", "VERIFY", "SUCCESS", userAccount.getId(), userAccount.getTenant().getId(), null, metadata, "MFA verification completed");
            return tokens;
        } catch (ResponseStatusException exception) {
            audit("AUTH_MFA_VERIFY", "VERIFY", "FAILURE", null, null, null, metadata, exception.getReason());
            throw exception;
        }
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        RequestMetadata metadata = requestMetadataResolver.current();
        try {
            TokenClaims claims = parseToken(
                request.refreshToken(),
                JwtTokenType.REFRESH,
                "Refresh token is invalid or expired"
            );
            tenantService.requireActiveTenant(claims.tenantId());
            String tokenHash = tokenHashService.hash(request.refreshToken());
            RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid"));

            if (refreshToken.getRevokedAt() != null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked");
            }
            if (refreshToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
            }
            if (!refreshToken.getId().equals(claims.tokenId())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token identity mismatch");
            }
            if (!refreshToken.getTenant().getId().equals(claims.tenantId())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token tenant mismatch");
            }

            refreshToken.setLastUsedAt(OffsetDateTime.now());
            refreshToken.setRevokedAt(OffsetDateTime.now());
            refreshToken.setRevocationReason("rotated");

            UserAccount userAccount = refreshToken.getUserAccount();
            if (!userAccount.isActive()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
            }
            TokenResponse tokens = issueTokens(userAccount);
            audit("AUTH_REFRESH", "REFRESH", "SUCCESS", userAccount.getId(), userAccount.getTenant().getId(), null, metadata, "Refresh token rotated");
            return tokens;
        } catch (ResponseStatusException exception) {
            audit("AUTH_REFRESH", "REFRESH", "FAILURE", null, null, null, metadata, exception.getReason());
            throw exception;
        }
    }

    @Transactional
    public LogoutResponse logout(String refreshTokenValue) {
        RequestMetadata metadata = requestMetadataResolver.current();
        String tokenHash = tokenHashService.hash(refreshTokenValue);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresentOrElse(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(OffsetDateTime.now());
                token.setRevocationReason("logout");
            }
            audit("AUTH_LOGOUT", "LOGOUT", "SUCCESS", token.getUserAccount().getId(), token.getTenant().getId(), null, metadata, "Refresh token revoked on logout");
        }, () -> {
            audit("AUTH_LOGOUT", "LOGOUT", "SUCCESS", null, null, null, metadata, "Logout requested for unknown token");
        });
        refreshTokenRepository.deleteByExpiresAtBefore(OffsetDateTime.now().minusDays(1));
        return new LogoutResponse("logged_out");
    }

    private TokenResponse issueTokens(UserAccount userAccount) {
        IssuedToken accessToken = jwtTokenService.issueAccessToken(userAccount);
        UUID refreshTokenId = UUID.randomUUID();
        IssuedToken refreshTokenJwt = jwtTokenService.issueRefreshToken(userAccount, refreshTokenId);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(refreshTokenId);
        refreshToken.setUserAccount(userAccount);
        refreshToken.setTenant(userAccount.getTenant());
        refreshToken.setTokenHash(tokenHashService.hash(refreshTokenJwt.token()));
        refreshToken.setIssuedAt(asOffsetDateTime(Instant.now()));
        refreshToken.setExpiresAt(asOffsetDateTime(refreshTokenJwt.expiresAt()));
        refreshTokenRepository.save(refreshToken);

        return new TokenResponse(
            userAccount.getTenant().getId(),
            "Bearer",
            accessToken.token(),
            accessToken.expiresAt(),
            refreshTokenJwt.token(),
            refreshTokenJwt.expiresAt()
        );
    }

    private UserAccount findActiveUserByEmailAndTenantId(String email, UUID tenantId) {
        tenantService.requireActiveTenant(tenantId);
        UserAccount userAccount = userAccountRepository.findByEmailAndTenant_Id(normalizeEmail(email), tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!userAccount.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
        }
        return userAccount;
    }

    private UserAccount findActiveUserById(String subject) {
        UUID userId = UUID.fromString(subject);
        UserAccount userAccount = userAccountRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account was not found"));
        if (!userAccount.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
        }
        return userAccount;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private TokenClaims parseToken(String token, JwtTokenType expectedType, String errorMessage) {
        try {
            return jwtTokenService.parse(token, expectedType);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, errorMessage, exception);
        }
    }

    private OffsetDateTime asOffsetDateTime(Instant instant) {
        return instant.atOffset(ZoneOffset.UTC);
    }

    private void audit(
        String resource,
        String action,
        String decision,
        UUID userId,
        UUID tenantId,
        Double riskScore,
        RequestMetadata metadata,
        String reason
    ) {
        auditLogService.recordAsync(new AuditEvent(
            userId,
            tenantId,
            resource,
            action,
            decision,
            riskScore,
            metadata.ipAddress(),
            metadata.deviceId(),
            reason,
            OffsetDateTime.now()
        ));
    }
}
