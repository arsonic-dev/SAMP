package com.samp.auth.config;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    @NotBlank
    private String jwtIssuer;

    @NotBlank
    @Size(min = 32)
    private String jwtSecret;

    @NotNull
    private Duration accessTokenTtl = Duration.ofMinutes(15);

    @NotNull
    private Duration refreshTokenTtl = Duration.ofDays(7);

    @NotNull
    private Duration mfaChallengeTtl = Duration.ofMinutes(5);

    @NotBlank
    private String totpIssuer = "SAMP";

    public String getJwtIssuer() {
        return jwtIssuer;
    }

    public void setJwtIssuer(String jwtIssuer) {
        this.jwtIssuer = jwtIssuer;
    }

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public Duration getAccessTokenTtl() {
        return accessTokenTtl;
    }

    public void setAccessTokenTtl(Duration accessTokenTtl) {
        this.accessTokenTtl = accessTokenTtl;
    }

    public Duration getRefreshTokenTtl() {
        return refreshTokenTtl;
    }

    public void setRefreshTokenTtl(Duration refreshTokenTtl) {
        this.refreshTokenTtl = refreshTokenTtl;
    }

    public Duration getMfaChallengeTtl() {
        return mfaChallengeTtl;
    }

    public void setMfaChallengeTtl(Duration mfaChallengeTtl) {
        this.mfaChallengeTtl = mfaChallengeTtl;
    }

    public String getTotpIssuer() {
        return totpIssuer;
    }

    public void setTotpIssuer(String totpIssuer) {
        this.totpIssuer = totpIssuer;
    }
}
