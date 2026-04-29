import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { policyApi } from '../api/policy'
import { auditApi } from '../api/audit'
import { RiskGauge } from '../components/RiskGauge'
import { AuditTable } from '../components/AuditTable'

function useJwtCountdown(token: string | null) {
  const [remaining, setRemaining] = useState<string>('')

  useEffect(() => {
    if (!token) return
    const getExpiry = () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000
        const diff = exp - Date.now()
        if (diff <= 0) return 'Expired'
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      } catch {
        return 'Unknown'
      }
    }
    setRemaining(getExpiry())
    const interval = setInterval(() => setRemaining(getExpiry()), 1000)
    return () => clearInterval(interval)
  }, [token])

  return remaining
}

export function DashboardHome() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setRiskScore = useAuthStore((s) => s.setRiskScore)
  const riskScore = useAuthStore((s) => s.riskScore)
  const countdown = useJwtCountdown(accessToken)

  useEffect(() => {
    if (!user?.id) return
    policyApi
      .evaluate({ userId: user.id, resource: 'dashboard', action: 'view', context: { ipAddress: '192.168.1.1' } })
      .then((r) => setRiskScore(r.data.riskScore))
      .catch(() => {})
  }, [user?.id, setRiskScore])

  const { data: auditData, isLoading: auditLoading, dataUpdatedAt } = useQuery({
    queryKey: ['audit-logs', user?.tenantId],
    queryFn: () => auditApi.getLogs(user?.tenantId ?? '', 5),
    enabled: !!user?.tenantId,
    refetchInterval: 10_000,
  })

  const logs = auditData?.data ?? []

  return (
    <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 bg-[#0a0a0a] text-[#f0ede6] overflow-y-auto custom-scrollbar">
      {/* Left Column: Node Status & Metadata */}
      <div className="flex-1 flex flex-col gap-6 min-w-[240px]">
        <div className="flex flex-col gap-4">
          <h2 className="font-data-mono text-[11px] text-white/30 uppercase tracking-[0.2em] border-b border-white/10 pb-2">PERSISTENT_NODE_STATE</h2>
          {/* Status Panel */}
          <div className="border border-white/10 bg-white/2 p-5 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-px bg-[#E8FF47]/20 group-hover:bg-[#E8FF47]/50 transition-colors"></div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/40 uppercase text-[10px]">UPLINK_STATUS</span>
              <span className="font-data-mono text-[10px] border border-[#E8FF47] text-[#E8FF47] px-2 py-0.5 bg-[#E8FF47]/10 tracking-widest">STABLE</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/40 uppercase text-[10px]">ACTIVE_NODES</span>
              <span className="text-[#E8FF47] text-[11px]">1,024 / 1,024</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/40 uppercase text-[10px]">LATENCY_AVG</span>
              <span className="text-[#E8FF47] text-[11px]">12ms</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/40 uppercase text-[10px]">ENCRYPTION_PROTO</span>
              <span className="font-data-mono text-[10px] border border-[#E8FF47]/30 text-[#E8FF47]/80 px-2 py-0.5">AES-256-GCM</span>
            </div>
          </div>
        </div>
        {/* Secondary Metadata Block */}
        <div className="flex flex-col gap-4 flex-1">
          <h2 className="font-data-mono text-[11px] text-white/30 uppercase tracking-[0.2em] border-b border-white/10 pb-2">RESOURCE_ALLOCATION</h2>
          <div className="border border-white/10 bg-white/1 p-5 flex flex-col gap-4 h-full relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#E8FF47]/30 to-transparent"></div>
            {/* Memory Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-data-mono text-[10px]">
                <span className="text-white/40">MEM_USAGE</span>
                <span className="text-white">64%</span>
              </div>
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-[#E8FF47] w-[64%]"></div>
              </div>
            </div>
            {/* CPU Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-data-mono text-[10px]">
                <span className="text-white/40">CPU_LOAD</span>
                <span className="text-error">89%</span>
              </div>
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-error w-[89%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Center Column: Primary Interaction */}
      <div className="w-full xl:w-[420px] flex-shrink-0 flex flex-col gap-6">
        {/* Large Status Header */}
        <div className="border border-white/10 bg-white/2 p-10 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#E8FF47]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#E8FF47]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#E8FF47]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#E8FF47]"></div>
          <div className="flex flex-col gap-2 text-center">
            <span className="font-data-mono text-[10px] text-white/30 tracking-[0.3em] uppercase">SYSTEM_RISK_ASSESSMENT</span>
            {riskScore === null ? (
               <h1 className="font-display-wordmark text-[52px] text-white/20 mt-4 mb-2 animate-pulse tracking-widest">ANALYZING...</h1>
            ) : riskScore < 30 ? (
              <>
                <h1 className="font-display-wordmark text-[52px] text-[#E8FF47] mt-4 mb-2 drop-shadow-[0_0_15px_rgba(232,255,71,0.3)] tracking-widest">NOMINAL</h1>
                <p className="text-white/40 border-t border-white/10 pt-4 mt-2 text-[10px] uppercase tracking-wider leading-relaxed">No imminent threats detected. All shields operational.</p>
              </>
            ) : riskScore < 70 ? (
              <>
                <h1 className="font-display-wordmark text-[52px] text-[#FFA500] mt-4 mb-2 drop-shadow-[0_0_15px_rgba(255,165,0,0.3)] tracking-widest">ELEVATED</h1>
                <p className="text-white/40 border-t border-white/10 pt-4 mt-2 text-[10px] uppercase tracking-wider leading-relaxed">Warning: Suspicious activity detected in sector-07.</p>
              </>
            ) : (
              <>
                <h1 className="font-display-wordmark text-[52px] text-error mt-4 mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] tracking-widest">CRITICAL</h1>
                <p className="text-white/40 border-t border-white/10 pt-4 mt-2 text-[10px] uppercase tracking-wider leading-relaxed">Critical threat: Immediate station lockdown required.</p>
              </>
            )}
          </div>
        </div>
        <div className="border border-white/10 bg-white/1 p-6 flex items-center justify-between group hover:bg-[#E8FF47]/5 transition-colors cursor-default">
          <div className="flex flex-col gap-1">
            <span className="font-data-mono text-[10px] text-white/30 uppercase">SESSION_EXPIRY</span>
            <span className="text-2xl font-bold text-[#E8FF47]">{countdown}</span>
          </div>
          <button className="bg-[#E8FF47] text-black px-6 py-2 font-data-mono text-[12px] font-bold hover:bg-[#d4ea30] transition-colors relative">
            RENEW_LEASE
          </button>
        </div>
        {/* Authentication Grid */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="border border-white/10 bg-white/1 p-5 flex flex-col gap-2 hover:border-[#E8FF47]/50 transition-colors">
            <span className="material-symbols-outlined text-[#E8FF47]">fingerprint</span>
            <span className="font-data-mono text-[10px] text-white/30">BIOMETRIC_AUTH</span>
            <span className="text-white text-[12px]">VERIFIED</span>
          </div>
          <div className="border border-white/10 bg-white/1 p-5 flex flex-col gap-2 hover:border-[#E8FF47]/50 transition-colors">
            <span className="material-symbols-outlined text-[#E8FF47]">key</span>
            <span className="font-data-mono text-[10px] text-white/30">HARDWARE_TOKEN</span>
            <span className="text-white text-[12px]">CONNECTED</span>
          </div>
        </div>
      </div>
      {/* Right Column: Audit Events & Health */}
      <div className="flex-1 flex flex-col gap-6 min-w-[280px]">
        <div className="flex flex-col gap-2 h-full">
          <div className="border border-white/10 bg-black p-5 flex-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
            <ul className="flex flex-col font-data-mono text-[11px] gap-1 pt-2">
              {logs.slice(0, 10).map((log) => (
                <li key={log.id} className={`flex gap-4 border-b border-white/5 py-1.5 ${log.decision === 'DENY' ? 'bg-error/5' : ''}`}>
                  <span className="text-white/10 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                  <span className="text-white/70 flex-1 truncate">{`${log.resource} : ${log.action}`.toUpperCase()}</span>
                  <span className={log.decision === 'DENY' ? 'text-error' : 'text-[#E8FF47]'}>{log.decision}</span>
                </li>
              ))}
              {logs.length === 0 && (
                 <li className="flex gap-4 py-1.5 opacity-50 text-white/50">NO_DATA_STREAM</li>
              )}
            </ul>
            {/* Bottom focus bar */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary-fixed/30"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

