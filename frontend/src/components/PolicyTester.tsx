import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { policyApi, PolicyEvaluationResponse } from '../api/policy'

const SENSITIVITY_OPTIONS = ['public', 'internal', 'confidential'] as const
type Sensitivity = (typeof SENSITIVITY_OPTIONS)[number]

export function PolicyTester() {
  const user = useAuthStore((s) => s.user)
  const [resource, setResource] = useState('document')
  const [action, setAction] = useState('read')
  const [sensitivity, setSensitivity] = useState<Sensitivity>('internal')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PolicyEvaluationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mfaRequired, setMfaRequired] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!user?.id) {
      setError('User context missing')
      return
    }
    setLoading(true)
    setResult(null)
    setError(null)
    setMfaRequired(false)

    try {
      const resp = await policyApi.evaluate({
        userId: user.id,
        resource,
        action,
        context: {
          resourceSensitivity: sensitivity,
          ipAddress: '192.168.1.1',
        },
      })
      setResult(resp.data)
    } catch (err: any) {
      const responseData = err.response?.data
      if (err.response?.status === 401) {
        setMfaRequired(true)
        setResult(responseData ?? { decision: 'STEP_UP', reason: 'MFA_CHALLENGE_REQUIRED', riskScore: 45, riskLevel: 'MEDIUM' })
      } else if (err.response?.status === 403) {
        setResult(responseData ?? { decision: 'DENY', reason: 'POLICY_VIOLATION_DETECTED', riskScore: 85, riskLevel: 'HIGH' })
      } else {
        setError('Simulation failure: Engine offline')
      }
    } finally {
      setLoading(false)
    }
  }

  const getDecisionTheme = () => {
    if (mfaRequired) return { color: 'text-[#E8FF47]', bg: 'bg-[#E8FF47]/10', border: 'border-[#E8FF47]/40', icon: 'sync_problem', label: 'STEP_UP' }
    if (result?.decision === 'ALLOW') return { color: 'text-[#60ff99]', bg: 'bg-[#60ff99]/10', border: 'border-[#60ff99]/40', icon: 'task_alt', label: 'ALLOW' }
    if (result?.decision === 'DENY') return { color: 'text-[#ff4444]', bg: 'bg-[#ff4444]/10', border: 'border-[#ff4444]/40', icon: 'gpp_bad', label: 'DENY' }
    return { color: 'text-white/20', bg: 'bg-white/5', border: 'border-white/10', icon: 'hourglass_empty', label: 'WAITING' }
  }

  const theme = getDecisionTheme()

  return (
    <div className="flex-1 p-10 flex flex-col h-full overflow-hidden relative bg-[#0a0a0a]">
      {/* Visual Underlays */}
      <div className="absolute inset-0 grid-overlay z-0 pointer-events-none"></div>
      <div className="absolute inset-0 scanline-overlay z-0 mix-blend-overlay opacity-30 pointer-events-none"></div>

      <div className="flex-1 flex gap-10 h-full min-h-0">
        {/* Left Column: Metadata */}
        <section className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-white/2 backdrop-blur-sm z-10 relative">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-data-mono text-[11px] text-white/40 uppercase tracking-widest">Target Entity</h2>
            <span className="material-symbols-outlined text-[14px] text-[#E8FF47]">info</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="border border-white/12 p-3 bg-white/[0.03]">
              <div className="font-label-micro text-label-micro text-on-surface-variant uppercase mb-2">Module ID</div>
              <div className="font-data-mono text-data-mono text-primary-fixed flex justify-between items-center">
                AUTHZ_V2_CORE
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary cursor-pointer" style={{ fontVariationSettings: "'FILL' 0" }}>content_copy</span>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-primary-fixed/30 bg-primary-fixed/5 px-3 py-2">
              <div className="w-2 h-2 rounded-none bg-primary-fixed animate-pulse"></div>
              <span className="font-status-ui text-status-ui text-primary-fixed uppercase tracking-widest">Active Test Environment</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="font-status-ui text-status-ui text-on-surface-variant">ENV</span>
                <span className="font-data-mono text-data-mono text-on-surface">STAGING</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="font-status-ui text-status-ui text-on-surface-variant">ENGINE</span>
                <span className="font-data-mono text-data-mono text-on-surface">REGO v0.58.0</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">Resource_Path</label>
                <input
                  className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 text-on-surface font-mono text-xs focus:outline-none focus:border-primary-fixed/50 transition-all rounded-none"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. system_v1/logs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">Operation_Action</label>
                <input
                  className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 text-on-surface font-mono text-xs focus:outline-none focus:border-primary-fixed/50 transition-all rounded-none"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="e.g. READ"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">Sensitivity</label>
                <select 
                  className="w-full bg-slate-900/50 border border-white/10 px-4 py-3 text-on-surface font-mono text-xs focus:outline-none focus:border-primary-fixed/50 transition-all rounded-none appearance-none"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
                >
                  {SENSITIVITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-auto p-4 flex flex-col gap-2 border-t border-outline-variant/30">
            <button className="w-full border border-white/12 bg-surface-container hover:bg-surface-bright py-2 flex justify-center items-center gap-2 transition-colors rounded-none">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>upload_file</span>
              <span className="font-status-ui text-status-ui text-on-surface uppercase">Load Payload</span>
            </button>
            <button className="w-full border border-white/12 bg-surface-container hover:bg-surface-bright py-2 flex justify-center items-center gap-2 transition-colors rounded-none">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>save</span>
              <span className="font-status-ui text-status-ui text-on-surface uppercase">Commit Policy</span>
            </button>
          </div>
        </section>

        {/* Center Column: Code Editor */}
        <section className="w-[520px] shrink-0 border-r border-outline-variant/30 flex flex-col bg-surface z-10 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="h-10 border-b border-outline-variant/30 flex bg-surface-container-low shrink-0">
            <div className="px-4 py-2 border-r border-outline-variant/30 border-b-2 border-b-primary-fixed bg-surface-container flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-primary-fixed" style={{ fontVariationSettings: "'FILL' 0" }}>code</span>
              <span className="font-status-ui text-status-ui text-primary-fixed uppercase">rules.rego</span>
            </div>
            <div className="px-4 py-2 border-r border-outline-variant/30 flex items-center gap-2 opacity-50 hover:opacity-100 cursor-pointer">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>data_object</span>
              <span className="font-status-ui text-status-ui text-on-surface uppercase">input.json</span>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-data-mono text-data-mono text-on-surface/80 relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-surface-container-low border-r border-outline-variant/20 flex flex-col py-4 px-2 text-right text-on-surface-variant opacity-50 select-none">
              {Array.from({ length: 20 }).map((_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            <pre className="pl-8 m-0 focus:outline-none">
              <code>
                <span className="text-primary-fixed">package</span> system.authz{'\n\n'}
                <span className="text-on-surface-variant"># Core Access Rules</span>{'\n'}
                <span className="text-primary-fixed">default</span> allow = <span className="text-error">false</span>{'\n\n'}
                allow {'{'}{'\n'}
                &nbsp;&nbsp;input.method == <span className="text-tertiary-fixed-dim">"{action.toUpperCase()}"</span>{'\n'}
                &nbsp;&nbsp;input.resource == <span className="text-tertiary-fixed-dim">"{resource}"</span>{'\n'}
                &nbsp;&nbsp;input.sensitivity == <span className="text-tertiary-fixed-dim">"{sensitivity}"</span>{'\n'}
                &nbsp;&nbsp;user_is_authorized{'\n'}
                &nbsp;&nbsp;risk_score_is_acceptable{'\n'}
                {'}'}
              </code>
            </pre>
          </div>
          <div className="h-[1px] w-full bg-primary-fixed opacity-50"></div>
          <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between shrink-0">
            <div className="font-status-ui text-status-ui text-on-surface-variant flex gap-4">
              <span>Ln 14, Col 2</span>
              <span>UTF-8</span>
              <span>REGO</span>
            </div>
            <button 
              onClick={() => handleSubmit()}
              disabled={loading}
              className="bg-primary-fixed text-on-primary-fixed px-6 py-2 font-button-label text-button-label uppercase hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 group rounded-none disabled:opacity-50"
            >
              {loading ? 'EXECUTING...' : 'EXECUTE_TEST'}
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'}`} style={{ fontVariationSettings: "'FILL' 0" }}>
                {loading ? 'refresh' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </section>

        {/* Right Column: Evaluation Telemetry */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest z-10 relative overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/50 shrink-0">
            <h2 className="font-status-ui text-status-ui text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>troubleshoot</span>
              Evaluation Telemetry
            </h2>
            <div className="font-data-mono text-data-mono text-on-surface-variant">
              [TIME: <span className="text-primary-fixed">14:02:59 UTC</span>]
            </div>
          </div>

          <div className={`p-6 border-b border-outline-variant/30 flex flex-col gap-6 items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] transition-colors duration-500 shrink-0 ${
            !result ? 'from-surface-container/20 via-background to-background' :
            result.decision === 'ALLOW' ? 'from-secondary-fixed/20 via-background to-background' :
            'from-error-container/20 via-background to-background'
          }`}>
            <div className="text-center flex flex-col items-center">
              <div className={`font-display-wordmark text-display-wordmark leading-none tracking-widest drop-shadow-[0_0_10px_rgba(255,180,171,0.5)] ${
                !result ? 'text-on-surface-variant' :
                result.decision === 'ALLOW' ? 'text-secondary-fixed' : 'text-error'
              }`}>
                {!result ? 'READY_FOR_SIM' : result.decision === 'ALLOW' ? 'ACCESS_GRANTED' : 'ACCESS_DENIED'}
              </div>
              <div className={`font-status-ui text-status-ui mt-2 uppercase border px-2 py-1 ${
                !result ? 'text-on-surface-variant border-outline-variant' :
                result.decision === 'ALLOW' ? 'text-secondary-fixed border-secondary-fixed/40' : 'text-error border-error/40'
              }`}>
                Result: {result?.decision ?? 'N/A'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="border border-white/5 bg-black/50 p-2 flex flex-col items-center">
                <span className="font-label-micro text-label-micro text-on-surface-variant">EVAL_TIME</span>
                <span className="font-data-mono text-data-mono text-primary-fixed">1.2ms</span>
              </div>
              <div className="border border-white/5 bg-black/50 p-2 flex flex-col items-center">
                <span className="font-label-micro text-label-micro text-on-surface-variant">RISK_SCORE</span>
                <span className={`font-data-mono text-data-mono ${!result ? 'text-on-surface-variant' : result.riskScore > 60 ? 'text-error' : 'text-secondary-fixed'}`}>
                  {result ? result.riskScore.toFixed(1) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Trace Stream */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-outline-variant/20 bg-surface-container-low font-status-ui text-status-ui text-on-surface-variant shrink-0">
              [SYSTEM.LOG] TRACE_OUTPUT
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-1 font-data-mono text-data-mono">
              {!result ? (
                <div className="h-full flex items-center justify-center opacity-30 uppercase tracking-[0.2em] font-display-wordmark text-[20px]">
                  Waiting_for_input...
                </div>
              ) : (
                <>
                  <div className="flex gap-4">
                    <span className="text-on-surface-variant/50 shrink-0">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                    <span className="text-on-surface">&gt; init.eval()</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-on-surface-variant/50 shrink-0">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                    <span className="text-on-surface">&gt; parsing input object... <span className="text-primary-fixed">[OK]</span></span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-on-surface-variant/50 shrink-0">L07</span>
                    <span className="text-on-surface">input.method == "{action.toUpperCase()}" <span className="text-primary-fixed ml-2">✔ match</span></span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-on-surface-variant/50 shrink-0">L08</span>
                    <span className="text-on-surface">input.resource == "{resource}" <span className="text-primary-fixed ml-2">✔ match</span></span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-on-surface-variant/50 shrink-0">L09</span>
                    <span className="text-on-surface">input.sensitivity == "{sensitivity}" <span className="text-primary-fixed ml-2">✔ match</span></span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-on-surface-variant/50 shrink-0">L11</span>
                    <span className={result.decision === 'ALLOW' ? 'text-on-surface' : 'text-error'}>
                      user_is_authorized <span className={result.decision === 'ALLOW' ? 'text-primary-fixed ml-2' : 'ml-2 font-bold'}>{result.decision === 'ALLOW' ? '✔ match' : '✖ FAIL'}</span>
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-on-surface-variant/50 shrink-0">L12</span>
                    <span className={result.riskScore < 70 ? 'text-on-surface' : 'text-error'}>
                      risk_score_is_acceptable <span className={result.riskScore < 70 ? 'text-primary-fixed ml-2' : 'ml-2 font-bold'}>{result.riskScore < 70 ? '✔ match' : '✖ FAIL'}</span>
                    </span>
                  </div>
                  <div className="flex gap-4 mt-4 pt-2 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant/50 shrink-0">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                    <span className={`${result.decision === 'ALLOW' ? 'text-secondary-fixed' : 'text-error'} font-bold`}>&gt; return {result.decision === 'ALLOW' ? 'true' : 'false'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function TraceItem({ label, status, desc }: { label: string, status: 'success' | 'error' | 'pending', desc: string }) {
  const icon = status === 'success' ? 'done' : status === 'error' ? 'close' : 'remove'
  const color = status === 'success' ? 'text-secondary-fixed border-secondary-fixed' : status === 'error' ? 'text-error border-error' : 'text-slate-600 border-white/10'
  
  return (
    <div className={`flex gap-4 items-start ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
        <span className="material-symbols-outlined text-[10px]">{icon}</span>
      </div>
      <div>
        <p className="font-mono text-[10px] text-on-surface font-bold uppercase tracking-tight">{label}</p>
        <p className="font-mono text-[9px] text-slate-500 mt-1 italic leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

