package com.samp.tenant;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public final class TenantModels {

    private TenantModels() {
    }

    public record TenantRegistrationRequest(
        @NotBlank @Size(max = 150) String name,
        @NotEmpty List<@NotBlank @Size(max = 100) String> allowedScopes,
        @NotEmpty List<@NotBlank @Size(max = 500) String> redirectUris
    ) {
    }

    public record TenantRegistrationResponse(
        UUID tenantId,
        String name,
        String clientId,
        String clientSecret,
        List<String> allowedScopes,
        List<String> redirectUris,
        OffsetDateTime createdAt
    ) {
    }
}
