import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { auditApi } from '../api/audit'
import { AuditTable } from '../components/AuditTable'

const DECISION_FILTERS = ['ALL', 'ALLOW', 'DENY', 'STEP_UP'] as const
type DecisionFilter = (typeof DECISION_FILTERS)[number]

export function AuditPage() {
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<DecisionFilter>('ALL')

  const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['audit-logs-full', user?.tenantId, filter],
    queryFn: () =>
      auditApi.getLogs(user?.tenantId ?? '', 50, filter === 'ALL' ? undefined : filter),
    enabled: !!user?.tenantId,
    refetchInterval: 15_000,
  })

  const logs = data?.data ?? []

  return (
    <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 h-full bg-[#0a0a0a]">
      {/* Left Column: Filters */}
      <section className="w-56 flex-shrink-0 flex flex-col border-r border-white/10 pr-6 h-full">
        <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="font-display-wordmark text-[18px] text-white uppercase tracking-wider">QUERY PARAMS</h2>
          <span className="material-symbols-outlined text-white/40 text-[18px]">filter_list</span>
        </header>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Input Group */}
          <div className="space-y-2">
            <label className="font-label-micro text-label-micro text-on-surface-variant uppercase block">TIME WINDOW</label>
            <input className="cyber-input w-full bg-white/[0.03] border border-white/[0.12] rounded-none text-on-surface px-3 py-2 font-data-mono text-data-mono" readOnly type="text" value="NOW - 24H"/>
          </div>
          {/* Input Group */}
          <div className="space-y-2">
            <label className="font-label-micro text-label-micro text-on-surface-variant uppercase block">NODE IDENTIFIER</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]" style={{fontVariationSettings: "'FILL' 0"}}>search</span>
              <input className="cyber-input w-full bg-white/[0.03] border border-white/[0.12] rounded-none text-on-surface pl-9 pr-3 py-2 font-data-mono text-data-mono placeholder:text-on-surface-variant/50" placeholder="e.g. EU-WEST-01" type="text"/>
            </div>
          </div>
          {/* Input Group */}
          <div className="space-y-2">
            <label className="font-label-micro text-label-micro text-on-surface-variant uppercase block">EVENT DECISION</label>
            <select 
              className="cyber-input w-full bg-surface-container border border-white/[0.12] rounded-none text-on-surface px-3 py-2 font-data-mono text-data-mono appearance-none focus:ring-0"
              value={filter}
              onChange={(e) => setFilter(e.target.value as DecisionFilter)}
            >
              {DECISION_FILTERS.map(f => (
                <option key={f} value={f}>{f === 'ALL' ? 'ALL_EVENTS' : f}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-6 mt-auto">
          <button onClick={() => refetch()} className="w-full bg-primary-fixed text-on-primary-fixed font-button-label text-button-label py-2 px-4 flex justify-between items-center group rounded-none hover:bg-primary-fixed-dim transition-colors">
            <span className="tracking-widest">APPLY FILTERS</span>
            <span className={`material-symbols-outlined transform ${isLoading ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'}`} style={{fontVariationSettings: "'FILL' 0"}}>
              {isLoading ? 'refresh' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </section>

      {/* Center Column: Data Table */}
      <section className="flex-1 flex flex-col h-full overflow-hidden min-w-[520px]">
        <header className="mb-6 flex flex-col space-y-1">
          <h1 className="font-display-wordmark text-[32px] text-white leading-none uppercase">AUDIT_LEDGER</h1>
          <div className="flex items-center space-x-4 text-white/40 font-data-mono text-[10px]">
            <span className="flex items-center"><div className="w-2 h-2 bg-[#E8FF47] rounded-full mr-2 animate-pulse"></div> LIVE SYNC ACTIVE</span>
            <span>|</span>
            <span>LAST_SYNC: {new Date(dataUpdatedAt).toLocaleTimeString([], {hour12: false})}</span>
          </div>
        </header>
        
        {/* Table Container */}
        <AuditTable logs={logs} loading={isLoading} />
      </section>

      {/* Right Column: Live Stream */}
      <section className="w-72 flex-shrink-0 flex flex-col h-full border-l border-white/10 pl-6 relative">
        {/* Light pipe effect */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-primary-fixed/30 to-transparent -ml-[1px]"></div>
        <header className="mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-display-wordmark text-[20px] text-white uppercase tracking-wider leading-none">RAW_TELEMETRY</h2>
            <span className="font-data-mono text-[10px] text-[#E8FF47] mt-1 uppercase tracking-widest">PORT: 8080 // SECURE</span>
          </div>
          <span className="material-symbols-outlined text-[#E8FF47] animate-pulse">sensors</span>
        </header>
        
        {/* Terminal Window */}
        <div className="flex-1 bg-black border border-outline-variant p-4 overflow-y-auto font-data-mono text-data-mono relative group">
          <div className="absolute inset-0 bg-[#E8FF47]/5 pointer-events-none mix-blend-overlay"></div>
          <ul className="space-y-1.5 text-white/40 relative z-10">
            {logs.slice(0, 15).map(log => {
              const isError = log.decision === 'DENY';
              return (
                <li key={`term-${log.id}`} className={isError ? 'text-error' : ''}>
                  <span className={isError ? 'text-error/70' : 'text-outline'}>{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}.000</span> &gt; [{log.resource}] <span className={isError ? 'text-error' : 'text-primary-fixed'}>{isError ? 'DROP' : 'OK'}</span> {log.action}
                  {isError && log.reason && (
                    <>
                      <br/><span className="text-error pl-8">↳ REASON: {log.reason.toUpperCase().replace(/\s/g, '_')}</span>
                    </>
                  )}
                </li>
              );
            })}
            {logs.length === 0 && (
               <li className="opacity-50"><span className="text-outline">{new Date().toLocaleTimeString([], {hour12: false})}</span> &gt; [IDLE] KEEPALIVE...</li>
            )}
          </ul>
          {/* Blinking cursor */}
          <div className="mt-4 flex items-center text-[#E8FF47] relative z-10">
            <span>&gt;</span>
            <div className="w-2 h-4 bg-[#E8FF47] ml-2 animate-[pulse_1s_steps(2,start)_infinite]"></div>
          </div>
        </div>
        
        {/* Mini Status Panel below terminal */}
        <div className="mt-4 border border-white/10 p-3 bg-white/2 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="font-data-mono text-[9px] text-white/30 uppercase">CPU LOAD</span>
            <span className="font-data-mono text-[11px] text-[#E8FF47]">14.2%</span>
          </div>
          <div className="flex flex-col">
            <span className="font-data-mono text-[9px] text-white/30 uppercase">MEM USE</span>
            <span className="font-data-mono text-[11px] text-white/70">2.1GB</span>
          </div>
        </div>
      </section>
    </div>
  )
}

