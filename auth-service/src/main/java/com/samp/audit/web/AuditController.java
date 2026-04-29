package com.samp.audit.web;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.samp.audit.AuditModels.AuditLogResponse;
import com.samp.audit.service.AuditLogService;
import com.samp.common.security.AuthenticatedTenantContext;
import com.samp.common.security.SecurityPrincipalService;

import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/audit")
public class AuditController {

    private final AuditLogService auditLogService;
    private final SecurityPrincipalService securityPrincipalService;

    public AuditController(AuditLogService auditLogService, SecurityPrincipalService securityPrincipalService) {
        this.auditLogService = auditLogService;
        this.securityPrincipalService = securityPrincipalService;
    }

    @GetMapping("/logs")
    public List<AuditLogResponse> logs(
        @RequestParam(required = false) UUID tenantId,
        @RequestParam(required = false) UUID userId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        AuthenticatedTenantContext actor = securityPrincipalService.requireCurrent();
        UUID effectiveTenantId = tenantId == null ? actor.tenantId() : tenantId;
        if (!effectiveTenantId.equals(actor.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Audit access is restricted to the authenticated tenant");
        }
        return auditLogService.findLogs(effectiveTenantId, userId, from, to);
    }
}
