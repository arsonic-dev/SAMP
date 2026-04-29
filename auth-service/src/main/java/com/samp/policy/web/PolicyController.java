package com.samp.policy.web;

import java.util.UUID;

import com.samp.common.security.AuthenticatedTenantContext;
import com.samp.common.security.SecurityPrincipalService;
import com.samp.policy.PolicyModels.AssignmentResponse;
import com.samp.policy.PolicyModels.CreatePermissionRequest;
import com.samp.policy.PolicyModels.CreatePolicyRequest;
import com.samp.policy.PolicyModels.CreateRoleRequest;
import com.samp.policy.PolicyModels.PermissionResponse;
import com.samp.policy.PolicyModels.PolicyEvaluationRequest;
import com.samp.policy.PolicyModels.PolicyEvaluationResponse;
import com.samp.policy.PolicyModels.PolicyRuleResponse;
import com.samp.policy.PolicyModels.RoleResponse;
import com.samp.policy.service.PolicyService;
import com.samp.policy.service.PolicyService.PolicyEvaluationOutcome;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/policy")
public class PolicyController {

    private final PolicyService policyService;
    private final SecurityPrincipalService securityPrincipalService;

    public PolicyController(PolicyService policyService, SecurityPrincipalService securityPrincipalService) {
        this.policyService = policyService;
        this.securityPrincipalService = securityPrincipalService;
    }

    @PostMapping("/roles")
    public RoleResponse createRole(@Valid @RequestBody CreateRoleRequest request) {
        return policyService.createRole(currentActor(), request);
    }

    @PostMapping("/permissions")
    public PermissionResponse createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        return policyService.createPermission(request);
    }

    @PostMapping("/roles/{roleId}/permissions/{permissionId}")
    public AssignmentResponse assignPermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        return policyService.assignPermission(currentActor(), roleId, permissionId);
    }

    @PostMapping("/users/{userId}/roles/{roleId}")
    public AssignmentResponse assignRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
        return policyService.assignRoleToUser(currentActor(), userId, roleId);
    }

    @PostMapping("/rules")
    public PolicyRuleResponse createRule(@Valid @RequestBody CreatePolicyRequest request) {
        return policyService.createPolicy(currentActor(), request);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<PolicyEvaluationResponse> evaluate(@Valid @RequestBody PolicyEvaluationRequest request) {
        PolicyEvaluationOutcome outcome = policyService.evaluate(currentActor(), request);
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(outcome.status());
        if (outcome.challengeToken() != null) {
            builder.header("X-MFA-Challenge-Token", outcome.challengeToken());
            builder.header(HttpHeaders.WWW_AUTHENTICATE, "MFA");
        }
        return builder.body(outcome.body());
    }

    private AuthenticatedTenantContext currentActor() {
        return securityPrincipalService.requireCurrent();
    }
}
