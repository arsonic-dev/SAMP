import { AuditLog } from '../api/audit'

interface AuditTableProps {
  logs: AuditLog[]
  loading?: boolean
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { class: string; label: string }> = {
    ALLOW: { class: 'border-white/20 text-white/70', label: 'SUCCESS' },
    DENY: { class: 'border-error text-error bg-error/10', label: 'DENIED' },
    STEP_UP: { class: 'border-[#E8FF47] text-[#E8FF47] bg-[#E8FF47]/10', label: 'PENDING' },
  }
  const c = config[decision] ?? { class: 'border-white/5 text-white/30', label: 'UNKNOWN' }
  return (
    <span className={`border px-1.5 py-0.5 text-status-ui font-status-ui uppercase ${c.class}`}>
      {c.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center border-b border-white/5 px-4 py-3 animate-pulse">
      <div className="w-32 shrink-0"><div className="h-2 bg-white/10 rounded-none w-20" /></div>
      <div className="w-32 shrink-0"><div className="h-2 bg-white/10 rounded-none w-24" /></div>
      <div className="flex-1"><div className="h-2 bg-white/10 rounded-none w-32" /></div>
      <div className="w-40 shrink-0"><div className="h-2 bg-white/10 rounded-none w-24" /></div>
      <div className="w-28 shrink-0 flex justify-end"><div className="h-3 bg-white/10 rounded-none w-16" /></div>
    </div>
  )
}

export function AuditTable({ logs, loading }: AuditTableProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Inner glow/border effect */}
      <div className="absolute inset-0 border border-white/[0.05] pointer-events-none z-10 m-[1px]"></div>
      
      {/* Table Header */}
      <div className="flex border-b border-white/10 bg-white/2 font-data-mono text-[9px] text-white/30 uppercase px-4 py-3 shrink-0">
        <div className="w-32 shrink-0">TIMESTAMP</div>
        <div className="w-32 shrink-0">RESOURCE</div>
        <div className="flex-1">ACTION / REASON</div>
        <div className="w-24 shrink-0">RISK</div>
        <div className="w-28 shrink-0 text-right">STATUS</div>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : logs.length === 0
          ? (
            <div className="px-6 py-12 text-center text-on-surface-variant font-data-mono text-data-mono uppercase tracking-widest">
              NO_AUDIT_LOGS_FOUND_IN_CURRENT_NODE
            </div>
          )
          : logs.map((log) => {
              const isError = log.decision === 'DENY';
              return (
                <div 
                  key={log.id}
                  className={`flex items-center border-b border-surface-variant transition-colors px-4 py-3 group cursor-crosshair relative ${isError ? 'bg-error-container/5 hover:bg-error-container/20' : 'hover:bg-surface-container-low'}`}
                >
                  {isError && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>}
                  <div className="w-32 shrink-0 font-data-mono text-data-mono text-on-surface-variant group-hover:text-on-surface">
                    {new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}.000
                  </div>
                  <div className={`w-32 shrink-0 font-data-mono text-data-mono ${isError ? 'text-error font-bold' : 'text-on-surface'}`}>
                    {log.resource}
                  </div>
                  <div className="flex-1 font-data-mono text-data-mono text-on-surface flex items-center space-x-2">
                    <span className={`material-symbols-outlined text-[14px] ${isError ? 'text-error' : 'text-outline'}`} style={{fontVariationSettings: "'FILL' 0"}}>
                      {isError ? 'public' : 'person'}
                    </span>
                    <span>{log.action} <span className="text-on-surface-variant/50 ml-2">{log.reason ? `// ${log.reason}` : ''}</span></span>
                  </div>
                  <div className="w-24 shrink-0 font-data-mono text-data-mono text-on-surface">
                     {log.riskScore !== null ? (
                        <span className={`font-bold ${log.riskScore >= 70 ? 'text-error' : log.riskScore >= 30 ? 'text-[#FFA500]' : 'text-primary-fixed'}`}>
                          {log.riskScore.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                  </div>
                  <div className="w-28 shrink-0 text-right">
                    <DecisionBadge decision={log.decision} />
                  </div>
                </div>
              )
            })}
      </div>
      
      {/* Pagination Footer */}
      <div className="border-t border-outline-variant bg-surface-container px-4 py-2 flex justify-between items-center shrink-0">
        <span className="font-status-ui text-status-ui text-on-surface-variant">PAGE 01 / 01</span>
        <div className="flex space-x-2">
          <button className="border border-outline-variant hover:border-primary-fixed text-on-surface p-1 rounded-none transition-colors"><span className="material-symbols-outlined text-[16px] block" style={{fontVariationSettings: "'FILL' 0"}}>chevron_left</span></button>
          <button className="border border-outline-variant hover:border-primary-fixed text-on-surface p-1 rounded-none transition-colors"><span className="material-symbols-outlined text-[16px] block" style={{fontVariationSettings: "'FILL' 0"}}>chevron_right</span></button>
        </div>
      </div>
    </div>
  )
}

