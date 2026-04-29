package com.samp.auth;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthModels {

    private AuthModels() {
    }

    public record RegisterRequest(
        @NotNull UUID tenantId,
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        Boolean mfaEnabled
    ) {
    }

    public record RegisterResponse(
        UUID tenantId,
        UUID userId,
        String email,
        boolean mfaEnabled,
        String totpSecret,
        String totpProvisioningUri,
        OffsetDateTime createdAt
    ) {
    }

    public record LoginRequest(
        @NotNull UUID tenantId,
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank String password
    ) {
    }

    public record LoginResponse(
        boolean mfaRequired,
        String challengeToken,
        Instant challengeTokenExpiresAt,
        TokenResponse tokens
    ) {
    }

    public record MfaVerifyRequest(
        @NotBlank String challengeToken,
        @NotBlank @Pattern(regexp = "\\d{6}") String code
    ) {
    }

    public record RefreshRequest(
        @NotBlank String refreshToken
    ) {
    }

    public record LogoutRequest(
        @NotBlank String refreshToken
    ) {
    }

    public record LogoutResponse(
        String status
    ) {
    }

    public record TokenResponse(
        UUID tenantId,
        String tokenType,
        String accessToken,
        Instant accessTokenExpiresAt,
        String refreshToken,
        Instant refreshTokenExpiresAt
    ) {
    }
}
