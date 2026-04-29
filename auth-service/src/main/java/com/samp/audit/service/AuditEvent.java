package com.samp.audit.service;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditEvent(
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
