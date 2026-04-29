import api from './axios'

export interface AuditLog {
  id: string
  userId: string
  tenantId: string
  resource: string
  action: string
  decision: string
  riskScore: number | null
  ip: string | null
  deviceId: string | null
  reason: string | null
  timestamp: string
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
}

export const auditApi = {
  getLogs: (tenantId: string, _limit = 20, _decision?: string) =>
    api.get<AuditLog[]>('/audit/logs', {
      params: { tenantId },
    }),
}
