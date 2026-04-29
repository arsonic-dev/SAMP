import api from './axios'

// ─── Policy Evaluation ───────────────────────────────────────────────────────

export interface PolicyEvaluationContext {
  /** 'public' | 'internal' | 'confidential' */
  resourceSensitivity?: string
  ipAddress?: string
  deviceId?: string
  deviceFingerprint?: string
  /** ISO-8601 datetime string — defaults to now on backend if omitted */
  requestTime?: string
}

export interface PolicyEvaluationRequest {
  /** Must be a valid UUID — parsed from the JWT `sub` claim */
  userId: string
  resource: string
  action: string
  context?: PolicyEvaluationContext
}

/** Returned on HTTP 200 (ALLOW), 401 (STEP_UP/MFA required), or 403 (DENY) */
export interface PolicyEvaluationResponse {
  decision: 'ALLOW' | 'DENY' | 'STEP_UP'
  reason: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

// ─── Role / Permission / Rule Management ─────────────────────────────────────

export interface RoleResponse {
  id: string
  tenantId: string
  name: string
}

export interface PermissionResponse {
  id: string
  name: string
  resource: string
  action: string
}

export interface AssignmentResponse {
  status: string
  roleId: string | null
  permissionId: string | null
  userId: string | null
}

export interface PolicyConditions {
  maxRiskScore?: number
  allowedResourceSensitivities?: string[]
  allowedFromHour?: string
  allowedToHour?: string
}

export type PolicyEffect = 'ALLOW' | 'DENY'

export interface PolicyRuleResponse {
  id: string
  tenantId: string
  roleName: string
  effect: PolicyEffect
  conditions: PolicyConditions
  createdAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const policyApi = {
  /** Evaluate access — used by dashboard, risk monitor, and policy tester */
  evaluate: (request: PolicyEvaluationRequest) =>
    api.post<PolicyEvaluationResponse>('/policy/evaluate', request),

  /** Create a named role scoped to the current tenant */
  createRole: (name: string) =>
    api.post<RoleResponse>('/policy/roles', { name }),

  /** Create a permission with resource + action */
  createPermission: (name: string, resource: string, action: string) =>
    api.post<PermissionResponse>('/policy/permissions', { name, resource, action }),

  /** Assign a permission to a role */
  assignPermission: (roleId: string, permissionId: string) =>
    api.post<AssignmentResponse>(`/policy/roles/${roleId}/permissions/${permissionId}`),

  /** Assign a role to a user */
  assignRole: (userId: string, roleId: string) =>
    api.post<AssignmentResponse>(`/policy/users/${userId}/roles/${roleId}`),

  /** Create an ABAC policy rule */
  createRule: (roleName: string, effect: PolicyEffect, conditions: PolicyConditions) =>
    api.post<PolicyRuleResponse>('/policy/rules', { roleName, effect, conditions }),
}
