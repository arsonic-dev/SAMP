package com.samp.audit.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.samp.audit.AuditModels.AuditLogResponse;
import com.samp.audit.domain.AuditLog;
import com.samp.audit.repository.AuditLogRepository;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional
    public void recordAsync(AuditEvent event) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(event.userId());
        auditLog.setTenantId(event.tenantId());
        auditLog.setResource(event.resource());
        auditLog.setAction(event.action());
        auditLog.setDecision(event.decision());
        auditLog.setRiskScore(event.riskScore());
        auditLog.setIp(event.ip());
        auditLog.setDeviceId(event.deviceId());
        auditLog.setReason(event.reason());
        auditLog.setTimestamp(event.timestamp() == null ? OffsetDateTime.now() : event.timestamp());
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> findLogs(UUID tenantId, UUID userId, OffsetDateTime from, OffsetDateTime to) {
        return auditLogRepository.findAll((root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();
            if (tenantId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("tenantId"), tenantId));
            }
            if (userId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("userId"), userId));
            }
            if (from != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("timestamp"), from));
            }
            if (to != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("timestamp"), to));
            }
            return predicate;
        }, Sort.by(Sort.Direction.DESC, "timestamp")).stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
            auditLog.getId(),
            auditLog.getUserId(),
            auditLog.getTenantId(),
            auditLog.getResource(),
            auditLog.getAction(),
            auditLog.getDecision(),
            auditLog.getRiskScore(),
            auditLog.getIp(),
            auditLog.getDeviceId(),
            auditLog.getReason(),
            auditLog.getTimestamp()
        );
    }
}
