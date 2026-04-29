package com.samp.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import com.samp.auth.config.AuthProperties;
import com.samp.auth.domain.UserAccount;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String EMAIL_CLAIM = "email";
    private static final String MFA_ENABLED_CLAIM = "mfa_enabled";
    private static final String TENANT_ID_CLAIM = "tenant_id";

    private final AuthProperties authProperties;
    private final SecretKey signingKey;

    public JwtTokenService(AuthProperties authProperties) {
        this.authProperties = authProperties;
        this.signingKey = Keys.hmacShaKeyFor(authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public IssuedToken issueAccessToken(UserAccount userAccount) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(authProperties.getAccessTokenTtl());
        String token = buildToken(
            userAccount.getId().toString(),
            JwtTokenType.ACCESS,
            UUID.randomUUID(),
            issuedAt,
            expiresAt,
            Map.of(
                EMAIL_CLAIM, userAccount.getEmail(),
                MFA_ENABLED_CLAIM, userAccount.isMfaEnabled(),
                TENANT_ID_CLAIM, userAccount.getTenant().getId().toString()
            )
        );
        return new IssuedToken(token, expiresAt, null);
    }

    public IssuedToken issueRefreshToken(UserAccount userAccount, UUID tokenId) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(authProperties.getRefreshTokenTtl());
        String token = buildToken(
            userAccount.getId().toString(),
            JwtTokenType.REFRESH,
            tokenId,
            issuedAt,
            expiresAt,
            Map.of(
                EMAIL_CLAIM, userAccount.getEmail(),
                TENANT_ID_CLAIM, userAccount.getTenant().getId().toString()
            )
        );
        return new IssuedToken(token, expiresAt, tokenId);
    }

    public IssuedToken issueMfaChallengeToken(UserAccount userAccount) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(authProperties.getMfaChallengeTtl());
        String token = buildToken(
            userAccount.getId().toString(),
            JwtTokenType.MFA_CHALLENGE,
            UUID.randomUUID(),
            issuedAt,
            expiresAt,
            Map.of(
                EMAIL_CLAIM, userAccount.getEmail(),
                TENANT_ID_CLAIM, userAccount.getTenant().getId().toString()
            )
        );
        return new IssuedToken(token, expiresAt, null);
    }

    public TokenClaims parse(String token, JwtTokenType expectedType) {
        Claims claims = Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(authProperties.getJwtIssuer())
            .build()
            .parseSignedClaims(token)
            .getPayload();

        JwtTokenType actualType = JwtTokenType.valueOf(claims.get(TOKEN_TYPE_CLAIM, String.class));
        if (actualType != expectedType) {
            throw new IllegalArgumentException("Unexpected token type");
        }

        return new TokenClaims(
            claims.getSubject(),
            claims.getId() == null ? null : UUID.fromString(claims.getId()),
            claims.get(EMAIL_CLAIM, String.class),
            UUID.fromString(claims.get(TENANT_ID_CLAIM, String.class)),
            actualType,
            claims.getIssuedAt().toInstant(),
            claims.getExpiration().toInstant()
        );
    }

    private String buildToken(
        String subject,
        JwtTokenType tokenType,
        UUID tokenId,
        Instant issuedAt,
        Instant expiresAt,
        Map<String, Object> claims
    ) {
        return Jwts.builder()
            .id(tokenId.toString())
            .subject(subject)
            .issuer(authProperties.getJwtIssuer())
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(expiresAt))
            .claims(claims)
            .claim(TOKEN_TYPE_CLAIM, tokenType.name())
            .signWith(signingKey)
            .compact();
    }

    public record IssuedToken(
        String token,
        Instant expiresAt,
        UUID tokenId
    ) {
    }

    public record TokenClaims(
        String subject,
        UUID tokenId,
        String email,
        UUID tenantId,
        JwtTokenType tokenType,
        Instant issuedAt,
        Instant expiresAt
    ) {
    }
}
