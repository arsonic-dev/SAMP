package com.samp.policy.service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samp.audit.service.AuditEvent;
import com.samp.audit.service.AuditLogService;
import com.samp.audit.service.RequestMetadata;
import com.samp.audit.service.RequestMetadataResolver;
import com.samp.auth.domain.UserAccount;
import com.samp.auth.repository.UserAccountRepository;
import com.samp.auth.service.JwtTokenService;
import com.samp.common.security.AuthenticatedTenantContext;
import com.samp.policy.PolicyEffect;
import com.samp.policy.PolicyModels.AssignmentResponse;
import com.samp.policy.PolicyModels.CreatePermissionRequest;
import com.samp.policy.PolicyModels.CreatePolicyRequest;
import com.samp.policy.PolicyModels.CreateRoleRequest;
import com.samp.policy.PolicyModels.PermissionResponse;
import com.samp.policy.PolicyModels.PolicyConditions;
import com.samp.policy.PolicyModels.PolicyEvaluationContext;
import com.samp.policy.PolicyModels.PolicyEvaluationRequest;
import com.samp.policy.PolicyModels.PolicyEvaluationResponse;
import com.samp.policy.PolicyModels.PolicyRuleResponse;
import com.samp.policy.PolicyModels.RoleResponse;
import com.samp.policy.domain.Permission;
import com.samp.policy.domain.PolicyRule;
import com.samp.policy.domain.Role;
import com.samp.policy.repository.PermissionRepository;
import com.samp.policy.repository.PolicyRuleRepository;
import com.samp.policy.repository.RoleRepository;
import com.samp.risk.service.RiskClientService;
import com.samp.risk.service.RiskClientService.RiskAssessment;
import com.samp.tenant.domain.Tenant;
import com.samp.tenant.service.TenantService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PolicyService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final UserAccountRepository userAccountRepository;
    private final TenantService tenantService;
    private final ObjectMapper objectMapper;
    private final RiskClientService riskClientService;
    private final JwtTokenService jwtTokenService;
    private final AuditLogService auditLogService;
    private final RequestMetadataResolver requestMetadataResolver;

    public PolicyService(
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        PolicyRuleRepository policyRuleRepository,
        UserAccountRepository userAccountRepository,
        TenantService tenantService,
        ObjectMapper objectMapper,
        RiskClientService riskClientService,
        JwtTokenService jwtTokenService,
        AuditLogService auditLogService,
        RequestMetadataResolver requestMetadataResolver
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.policyRuleRepository = policyRuleRepository;
        this.userAccountRepository = userAccountRepository;
        this.tenantService = tenantService;
        this.objectMapper = objectMapper;
        this.riskClientService = riskClientService;
        this.jwtTokenService = jwtTokenService;
        this.auditLogService = auditLogService;
        this.requestMetadataResolver = requestMetadataResolver;
    }

    @Transactional
    public RoleResponse createRole(AuthenticatedTenantContext actor, CreateRoleRequest request) {
        if (roleRepository.existsByTenant_IdAndNameIgnoreCase(actor.tenantId(), request.name().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Role already exists for this tenant");
        }

        Tenant tenant = tenantService.requireActiveTenant(actor.tenantId());
        Role role = new Role();
        role.setTenant(tenant);
        role.setName(request.name().trim());
        Role savedRole = roleRepository.save(role);
        return new RoleResponse(savedRole.getId(), tenant.getId(), savedRole.getName());
    }

    @Transactional
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        Permission permission = permissionRepository.findByResourceIgnoreCaseAndActionIgnoreCase(
                request.resource().trim(),
                request.action().trim()
            )
            .orElseGet(Permission::new);
        permission.setName(request.name().trim());
        permission.setResource(request.resource().trim());
        permission.setAction(request.action().trim());
        Permission savedPermission = permissionRepository.save(permission);
        return new PermissionResponse(savedPermission.getId(), savedPermission.getName(), savedPermission.getResource(), savedPermission.getAction());
    }

    @Transactional
    public AssignmentResponse assignPermission(AuthenticatedTenantContext actor, UUID roleId, UUID permissionId) {
        Role role = roleRepository.findByIdAndTenant_Id(roleId, actor.tenantId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role was not found"));
        Permission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission was not found"));
        role.getPermissions().add(permission);
        return new AssignmentResponse("permission_assigned", role.getId(), permission.getId(), null);
    }

    @Transactional
    public AssignmentResponse assignRoleToUser(AuthenticatedTenantContext actor, UUID userId, UUID roleId) {
        Role role = roleRepository.findByIdAndTenant_Id(roleId, actor.tenantId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role was not found"));
        UserAccount userAccount = requireTenantUser(userId, actor.tenantId());
        userAccount.getRoles().add(role);
        return new AssignmentResponse("role_assigned", role.getId(), null, userAccount.getId());
    }

    @Transactional
    public PolicyRuleResponse createPolicy(AuthenticatedTenantContext actor, CreatePolicyRequest request) {
        tenantService.requireActiveTenant(actor.tenantId());
        roleRepository.findByTenant_IdAndNameIgnoreCase(actor.tenantId(), request.roleName().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role for policy was not found"));

        PolicyRule policyRule = new PolicyRule();
        policyRule.setTenant(tenantService.requireActiveTenant(actor.tenantId()));
        policyRule.setRoleName(request.roleName().trim().toLowerCase(Locale.ROOT));
        policyRule.setEffect(request.effect());
        policyRule.setConditionsJson(writeConditions(request.conditions()));
        PolicyRule savedRule = policyRuleRepository.save(policyRule);
        return toPolicyResponse(savedRule);
    }

    @Transactional(readOnly = true)
    public PolicyEvaluationOutcome evaluate(AuthenticatedTenantContext actor, PolicyEvaluationRequest request) {
        RequestMetadata requestMetadata = mergedMetadata(request.context());
        UserAccount userAccount = requireTenantUser(request.userId(), actor.tenantId());

        if (!hasPermission(userAccount, request.resource(), request.action())) {
            return denyWithAudit(userAccount, request, requestMetadata, null, "RBAC denied access");
        }

        RiskAssessment riskAssessment = riskClientService.resolveRisk(
            actor.tenantId(),
            userAccount.getId(),
            requestMetadata,
            effectiveRequestTime(request.context())
        );

        List<String> roleNames = userAccount.getRoles().stream()
            .map(Role::getName)
            .map(name -> name.toLowerCase(Locale.ROOT))
            .sorted(Comparator.naturalOrder())
            .toList();

        AbacDecision abacDecision = evaluatePolicies(actor.tenantId(), roleNames, request.context(), riskAssessment.riskScore());
        if (abacDecision.deny()) {
            return denyWithAudit(userAccount, request, requestMetadata, riskAssessment.riskScore(), abacDecision.reason());
        }

        if (riskClientService.shouldDeny(riskAssessment.riskScore())) {
            return denyWithAudit(userAccount, request, requestMetadata, riskAssessment.riskScore(), "Risk score exceeded deny threshold");
        }

        if (riskClientService.requiresStepUp(riskAssessment.riskScore())) {
            if (!userAccount.isMfaEnabled() || userAccount.getTotpSecret() == null) {
                return denyWithAudit(userAccount, request, requestMetadata, riskAssessment.riskScore(), "Step-up MFA required but user has no MFA configuration");
            }
            String challengeToken = jwtTokenService.issueMfaChallengeToken(userAccount).token();
            auditLogService.recordAsync(new AuditEvent(
                userAccount.getId(),
                actor.tenantId(),
                request.resource(),
                request.action(),
                "STEP_UP",
                riskAssessment.riskScore(),
                requestMetadata.ipAddress(),
                requestMetadata.deviceId(),
                "Risk score triggered step-up MFA",
                OffsetDateTime.now()
            ));
            return new PolicyEvaluationOutcome(
                HttpStatus.UNAUTHORIZED,
                new PolicyEvaluationResponse("ALLOW", "Step-up MFA required", riskAssessment.riskScore(), riskAssessment.riskLevel()),
                challengeToken
            );
        }

        auditLogService.recordAsync(new AuditEvent(
            userAccount.getId(),
            actor.tenantId(),
            request.resource(),
            request.action(),
            "ALLOW",
            riskAssessment.riskScore(),
            requestMetadata.ipAddress(),
            requestMetadata.deviceId(),
            "Policy evaluation allowed access",
            OffsetDateTime.now()
        ));

        return new PolicyEvaluationOutcome(
            HttpStatus.OK,
            new PolicyEvaluationResponse("ALLOW", abacDecision.reason(), riskAssessment.riskScore(), riskAssessment.riskLevel()),
            null
        );
    }

    private PolicyRuleResponse toPolicyResponse(PolicyRule policyRule) {
        return new PolicyRuleResponse(
            policyRule.getId(),
            policyRule.getTenant().getId(),
            policyRule.getRoleName(),
            policyRule.getEffect(),
            readConditions(policyRule.getConditionsJson()),
            policyRule.getCreatedAt()
        );
    }

    private UserAccount requireTenantUser(UUID userId, UUID tenantId) {
        UserAccount userAccount = userAccountRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User was not found"));
        if (!userAccount.getTenant().getId().equals(tenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not belong to the authenticated tenant");
        }
        if (!userAccount.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
        }
        return userAccount;
    }

    private boolean hasPermission(UserAccount userAccount, String resource, String action) {
        String normalizedResource = resource.trim().toLowerCase(Locale.ROOT);
        String normalizedAction = action.trim().toLowerCase(Locale.ROOT);
        return userAccount.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .anyMatch(permission -> matchesPermission(permission, normalizedResource, normalizedAction));
    }

    private boolean matchesPermission(Permission permission, String resource, String action) {
        String permissionResource = permission.getResource().trim().toLowerCase(Locale.ROOT);
        String permissionAction = permission.getAction().trim().toLowerCase(Locale.ROOT);
        return ("*".equals(permissionResource) || permissionResource.equals(resource))
            && ("*".equals(permissionAction) || permissionAction.equals(action));
    }

    private AbacDecision evaluatePolicies(
        UUID tenantId,
        List<String> roleNames,
        PolicyEvaluationContext context,
        double riskScore
    ) {
        if (roleNames.isEmpty()) {
            return new AbacDecision(true, "User has no roles for ABAC evaluation");
        }

        List<PolicyRule> policies = policyRuleRepository.findByTenant_IdAndRoleNameIn(tenantId, roleNames);
        if (policies.isEmpty()) {
            return new AbacDecision(false, "RBAC permission granted and no ABAC overrides were configured");
        }

        boolean allowMatch = false;
        for (PolicyRule policy : policies) {
            PolicyConditions conditions = readConditions(policy.getConditionsJson());
            if (!matchesConditions(conditions, context, riskScore)) {
                continue;
            }
            if (policy.getEffect() == PolicyEffect.DENY) {
                return new AbacDecision(true, "ABAC deny policy matched for role " + policy.getRoleName());
            }
            allowMatch = true;
        }

        if (allowMatch) {
            return new AbacDecision(false, "ABAC allow policy matched");
        }
        return new AbacDecision(true, "No ABAC allow policy matched");
    }

    private boolean matchesConditions(PolicyConditions conditions, PolicyEvaluationContext context, double riskScore) {
        if (conditions == null) {
            return true;
        }
        if (conditions.maxRiskScore() != null && riskScore > conditions.maxRiskScore()) {
            return false;
        }
        if (conditions.allowedResourceSensitivities() != null && !conditions.allowedResourceSensitivities().isEmpty()) {
            String requestedSensitivity = context == null || context.resourceSensitivity() == null
                ? ""
                : context.resourceSensitivity().trim().toLowerCase(Locale.ROOT);
            Set<String> allowed = conditions.allowedResourceSensitivities().stream()
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
            if (!allowed.contains(requestedSensitivity)) {
                return false;
            }
        }

        OffsetDateTime requestTime = effectiveRequestTime(context);
        if (conditions.allowedFromHour() != null && conditions.allowedToHour() != null) {
            int hour = requestTime.getHour();
            int from = Integer.parseInt(conditions.allowedFromHour());
            int to = Integer.parseInt(conditions.allowedToHour());
            if (from <= to) {
                if (hour < from || hour > to) {
                    return false;
                }
            } else {
                boolean inWrappedWindow = hour >= from || hour <= to;
                if (!inWrappedWindow) {
                    return false;
                }
            }
        }
        return true;
    }

    private OffsetDateTime effectiveRequestTime(PolicyEvaluationContext context) {
        return context != null && context.requestTime() != null ? context.requestTime() : OffsetDateTime.now();
    }

    private RequestMetadata mergedMetadata(PolicyEvaluationContext context) {
        RequestMetadata fallback = requestMetadataResolver.current();
        String deviceId = context != null && context.deviceId() != null ? context.deviceId() : fallback.deviceId();
        return new RequestMetadata(
            context != null && context.ipAddress() != null ? context.ipAddress() : fallback.ipAddress(),
            deviceId,
            context != null && context.deviceFingerprint() != null ? context.deviceFingerprint() : fallback.userAgent()
        );
    }

    private String writeConditions(PolicyConditions conditions) {
        try {
            return objectMapper.writeValueAsString(conditions == null ? new PolicyConditions(null, List.of(), null, null) : conditions);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to serialize policy conditions", exception);
        }
    }

    private PolicyConditions readConditions(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, PolicyConditions.class);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to parse stored policy conditions", exception);
        }
    }

    private PolicyEvaluationOutcome denyWithAudit(
        UserAccount userAccount,
        PolicyEvaluationRequest request,
        RequestMetadata metadata,
        Double riskScore,
        String reason
    ) {
        auditLogService.recordAsync(new AuditEvent(
            userAccount.getId(),
            userAccount.getTenant().getId(),
            request.resource(),
            request.action(),
            "DENY",
            riskScore,
            metadata.ipAddress(),
            metadata.deviceId(),
            reason,
            OffsetDateTime.now()
        ));
        return new PolicyEvaluationOutcome(
            HttpStatus.FORBIDDEN,
            new PolicyEvaluationResponse("DENY", reason, riskScore, riskScore == null ? null : (riskScore > 70 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW")),
            null
        );
    }

    private record AbacDecision(boolean deny, String reason) {
    }

    public record PolicyEvaluationOutcome(
        HttpStatus status,
        PolicyEvaluationResponse body,
        String challengeToken
    ) {
    }
}
