package com.samp.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class AuditModels {

    private AuditModels() {
    }

    public record AuditLogResponse(
        UUID id,
        UUID userId,
        UUID tenantId,
        String resource,
        String action,
        String decision,
        Double riskScore,
        String ip,
        String deviceId,
        String reason,
        OffsetDateTime timestamp
    ) {
    }
}
