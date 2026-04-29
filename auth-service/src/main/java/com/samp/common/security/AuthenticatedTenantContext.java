package com.samp.common.security;

import java.util.UUID;

public record AuthenticatedTenantContext(
    UUID userId,
    UUID tenantId,
    String email
) {
}
