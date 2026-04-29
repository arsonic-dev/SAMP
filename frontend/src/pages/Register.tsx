import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../api/auth'
import { Loader2 } from 'lucide-react'
import QRCode from 'qrcode'

type Step = 'tenant' | 'user' | 'totp'

export function Register() {
  const navigate = useNavigate()

  // Step state
  const [step, setStep] = useState<Step>('tenant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form fields
  const [tenantName, setTenantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Results
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const handleTenantStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const resp = await authApi.registerTenant(tenantName)
      setTenantId(resp.data.tenantId)
      // Save the human-readable tenant name for display in the dashboard
      localStorage.setItem(`tenant_name_${resp.data.tenantId}`, resp.data.name)
      setStep('user')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  const handleUserStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await authApi.registerUser(tenantId!, email, password)
      setTotpSecret(resp.data.totpSecret)
      
      const qr = await QRCode.toDataURL(resp.data.totpProvisioningUri, {
        color: { dark: '#00D4FF', light: '#051424' },
        width: 256,
        margin: 2,
      })
      setQrDataUrl(qr)
      setStep('totp')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Failed to register user')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const steps = ['tenant', 'user', 'totp'] as const
  const currentStepIdx = steps.indexOf(step)

  return (
    <div className="h-full w-full relative flex flex-col bg-[#0a0a0a] text-[#f0ede6] overflow-hidden font-sans">
      {/* Visual Underlays */}
      <div className="absolute inset-0 grid-overlay z-0 pointer-events-none opacity-30"></div>
      <div className="absolute inset-0 scanline-overlay z-0 mix-blend-overlay opacity-30 pointer-events-none"></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* TOP BAR */}
        <div className="border-b border-white/12 flex items-center justify-between px-10 h-[52px] shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-data-mono text-[10px] tracking-[0.15em] text-white/35 uppercase">SAMP_PROTOCOL / v2.0.4</span>
            <div className="w-[1px] h-4 bg-white/12"></div>
            <div className="flex items-center gap-2">
              <div className="w-[5px] h-[5px] rounded-full bg-[#e8ff47] animate-pulse"></div>
              <span className="font-data-mono text-[10px] tracking-[0.12em] text-[#e8ff47] uppercase">Enrollment Active</span>
            </div>
          </div>
          <div className="font-data-mono text-[10px] text-white/25 tracking-[0.08em]">
            {new Date().toLocaleTimeString([], { hour12: false, timeZoneName: 'short' })}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_380px_1fr] min-h-0 overflow-hidden">
          {/* LEFT COL: SYS_META */}
          <div className="border-r border-white/7 flex flex-col justify-center px-8 gap-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="font-display-wordmark text-[16px] text-[#f0ede6]">SYS_META</span>
                <span className="material-symbols-outlined text-[#e8ff47] text-[16px]">memory</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center border border-[#e8ff47]/30 bg-[#e8ff47]/5 px-3 py-2">
                  <span className="font-data-mono text-[9px] text-white/40 uppercase">UPLINK</span>
                  <span className="font-data-mono text-[9px] text-[#e8ff47] flex items-center gap-2 uppercase">
                    <span className="w-1.5 h-1.5 bg-[#e8ff47] rounded-full animate-pulse"></span>
                    SECURE
                  </span>
                </div>
                <div className="flex justify-between items-center border border-white/12 px-3 py-2">
                  <span className="font-data-mono text-[9px] text-white/40 uppercase">PROTOCOL</span>
                  <span className="font-data-mono text-[9px] text-white uppercase">INIT_SEQ_01</span>
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-2"></div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">REGION</span>
                  <span className="font-data-mono text-[11px] text-white/70">US-EAST-1</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">BUILD_VER</span>
                  <span className="font-data-mono text-[11px] text-white/70">v2.4.9-rc</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">TARGET_NODE</span>
                  <span className="font-data-mono text-[11px] text-white/70">SEC-09X</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">ENCRYPTION</span>
                  <span className="font-data-mono text-[11px] text-white/70">RSA-4096</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: PRIMARY INTERACTION (FORM) */}
          <div className="flex flex-col bg-white/2 backdrop-blur-md relative z-20">
            {/* Header */}
            <header className="h-16 px-8 flex flex-col justify-center border-b border-white/7">
              <h1 className="font-display-wordmark text-[24px] text-[#e8ff47] tracking-tight">ENROLL_</h1>
              <p className="font-data-mono text-[9px] text-white/40 mt-1 uppercase tracking-[0.1em]">NEW_TENANT_REGISTRATION_PROTOCOL</p>
            </header>
            
            {/* Progress HUD */}
            <div className="px-8 py-4 border-b border-white/5 bg-white/2 flex gap-1">
              <div className={`flex-1 h-1 transition-colors ${currentStepIdx >= 0 ? 'bg-[#e8ff47]' : 'bg-white/10'}`}></div>
              <div className={`flex-1 h-1 transition-colors ${currentStepIdx >= 1 ? 'bg-[#e8ff47]' : 'bg-white/10'}`}></div>
              <div className={`flex-1 h-1 transition-colors ${currentStepIdx >= 2 ? 'bg-[#e8ff47]' : 'bg-white/10'}`}></div>
            </div>

            {/* Form Container */}
            <div className="flex-1 px-8 py-10 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 'tenant' && (
                  <motion.form 
                    key="tenant" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    onSubmit={handleTenantStep} 
                    className="space-y-8"
                  >
                    <div className="space-y-6 relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#e8ff47]/50 to-transparent"></div>
                      <h2 className="font-data-mono text-[10px] text-[#e8ff47] flex items-center gap-2 uppercase tracking-[0.15em]">
                        <span className="material-symbols-outlined text-[14px]">domain</span>
                        [01] TENANT_IDENTIFICATION
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="font-data-mono text-[9px] text-white/40 uppercase tracking-[0.1em]">ORGANIZATION_NAME</label>
                          <input 
                            className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all placeholder:text-white/20"
                            placeholder="e.g. OMNICORP_GLOBAL"
                            value={tenantName}
                            onChange={(e) => setTenantName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-data-mono text-[9px] text-white/40 uppercase tracking-[0.1em]">OPERATING_ENVIRONMENT</label>
                          <select className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all appearance-none cursor-pointer">
                            <option className="bg-[#1a1a1a]">PRODUCTION_CLUSTER_A</option>
                            <option className="bg-[#1a1a1a]">STAGING_ENV_B</option>
                            <option className="bg-[#1a1a1a]">SECURE_SANDBOX</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex flex-col gap-4">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#e8ff47] text-[#0a0a0a] font-display-wordmark text-[14px] py-2.5 tracking-[0.1em] hover:bg-[#d4ea30] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? 'PROCESSING...' : 'PROCEED_TO_STEP_02'}
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                      <Link to="/login" className="font-data-mono text-[10px] text-white/30 hover:text-white/70 uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors py-2">
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        BACK_TO_AUTHENTICATION_TERMINAL
                      </Link>
                    </div>
                  </motion.form>
                )}

                {step === 'user' && (
                  <motion.form 
                    key="user" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    onSubmit={handleUserStep} 
                    className="space-y-8"
                  >
                    <div className="space-y-6 relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#e8ff47]/50 to-transparent"></div>
                      <h2 className="font-data-mono text-[10px] text-[#e8ff47] flex items-center gap-2 uppercase tracking-[0.15em]">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        [02] ROOT_AUTHORIZATION
                      </h2>
                      
                      <div className="p-3 bg-[#e8ff47]/5 border border-[#e8ff47]/20 font-data-mono text-[10px] text-[#e8ff47] mb-4 flex justify-between items-center uppercase">
                        <span>TENANT: {tenantId?.slice(0, 16)}...</span>
                        <span className="text-[8px] px-1 bg-[#e8ff47]/20">VERIFIED</span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="font-data-mono text-[9px] text-white/40 uppercase tracking-[0.1em]">ADMIN_EMAIL_ADDRESS</label>
                          <input 
                            type="email"
                            className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all placeholder:text-white/20"
                            placeholder="root@omnicorp.net"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="font-data-mono text-[9px] text-white/40 uppercase tracking-[0.1em]">ACCESS_KEY (PASSWORD)</label>
                            <input 
                              type="password"
                              className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all placeholder:text-white/20"
                              placeholder="••••••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="font-data-mono text-[9px] text-white/40 uppercase tracking-[0.1em]">VERIFY_KEY</label>
                            <input 
                              type="password"
                              className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all placeholder:text-white/20"
                              placeholder="••••••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-error/10 border border-error/20 p-3 flex gap-3 animate-shake">
                        <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                        <span className="font-data-mono text-[10px] text-error uppercase leading-relaxed">{error}</span>
                      </div>
                    )}

                    <div className="pt-8 flex flex-col gap-4">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#e8ff47] text-[#0a0a0a] font-display-wordmark text-[14px] py-2.5 tracking-[0.1em] hover:bg-[#d4ea30] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? 'PROCESSING...' : 'INITIALIZE_MFA_SYNC'}
                        <span className="material-symbols-outlined text-[16px]">sync</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStep('tenant')}
                        className="font-data-mono text-[10px] text-white/30 hover:text-white/70 uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors py-2"
                      >
                        <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                        RETURN_TO_TENANT_STEP
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === 'totp' && (
                  <motion.div 
                    key="totp" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="space-y-8"
                  >
                    <div className="space-y-6 relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#e8ff47]/50 to-transparent"></div>
                      <h2 className="font-data-mono text-[10px] text-[#e8ff47] flex items-center gap-2 uppercase tracking-[0.15em]">
                        <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                        [03] MULTI_FACTOR_SYNCHRONIZATION
                      </h2>

                      <div className="flex flex-col items-center gap-6 py-4">
                        <div className="bg-white p-2 border-2 border-[#e8ff47] shadow-[0_0_30px_rgba(232,255,71,0.2)]">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="MFA QR" className="w-32 h-32 block" />
                          ) : (
                            <div className="w-32 h-32 bg-[#1a1a1a] animate-pulse"></div>
                          )}
                        </div>
                        
                        <div className="w-full space-y-4">
                          <div className="bg-white/3 p-4 border border-white/10 relative">
                            <span className="font-data-mono text-[8px] text-white/30 uppercase block mb-1">Manual Secret Key:</span>
                            <div className="flex justify-between items-center gap-4">
                              <code className="text-[#e8ff47] font-data-mono text-[11px] tracking-[0.1em] break-all">{totpSecret}</code>
                              <button 
                                onClick={handleCopySecret}
                                className={`p-2 transition-colors ${copied ? 'text-[#e8ff47]' : 'text-white/30 hover:text-white/70'}`}
                              >
                                <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-[#e8ff47]/5 border border-[#e8ff47]/20 font-data-mono text-[10px] text-[#e8ff47]/80 leading-relaxed uppercase">
                            Scan the code above with your authenticator app. 
                            <span className="block mt-2 font-bold text-[#e8ff47]">CRITICAL: SAVE THIS KEY NOW. ACCESS IS IMPOSSIBLE WITHOUT IT.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/login', { state: { tenantId, email } })}
                      className="w-full bg-[#e8ff47] text-[#0a0a0a] font-display-wordmark text-[14px] py-2.5 tracking-[0.1em] hover:bg-[#d4ea30] transition-all flex items-center justify-center gap-2 group"
                    >
                      PROCEED_TO_STATION_AUTH
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">login</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/7 bg-white/2 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#e8ff47] text-[14px]">lock</span>
              <span className="font-data-mono text-[8px] text-white/30 uppercase tracking-[0.1em]">End-to-end encrypted session</span>
            </div>
          </div>

          {/* RIGHT COL: CONSOLE STREAM */}
          <div className="border-l border-white/7 bg-black/40 flex flex-col min-h-0 relative">
            <div className="absolute inset-0 scanline-overlay z-0 pointer-events-none opacity-20"></div>
            
            <header className="h-12 px-6 border-b border-white/7 flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[12px] text-white/40">terminal</span>
                <h3 className="font-data-mono text-[8px] text-white/50 tracking-[0.2em] uppercase">LIVE ENROLLMENT STREAM</h3>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/10"></div>
                <div className="w-1 h-1 bg-white/10"></div>
                <div className={`w-1 h-1 ${step === 'tenant' ? 'bg-[#e8ff47]' : 'bg-white/10'}`}></div>
              </div>
            </header>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-data-mono text-[9px] leading-relaxed relative z-10">
              <ul className="space-y-2">
                <li className="flex gap-4 opacity-50">
                  <span className="text-white/30 shrink-0">[14:00:01]</span>
                  <span className="text-white/70 uppercase">System boot sequence initiated</span>
                </li>
                <li className="flex gap-4 opacity-50">
                  <span className="text-white/30 shrink-0">[14:00:01]</span>
                  <span className="text-white/70 uppercase">Allocating memory blocks... <span className="text-[#e8ff47] ml-2">OK</span></span>
                </li>
                <li className="flex gap-4 opacity-50">
                  <span className="text-white/30 shrink-0">[14:00:02]</span>
                  <span className="text-white/70 uppercase">Establishing secure tunnel</span>
                </li>
                <li className="flex gap-4 opacity-50">
                  <span className="text-white/30 shrink-0">[14:00:03]</span>
                  <span className="text-white/70 uppercase">Handshake verified. RSA-4096 active</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-white/30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="text-[#e8ff47] animate-pulse uppercase">Awaiting operator input for {step} creation_</span>
                </li>
                {tenantId && (
                  <li className="flex gap-4 text-[#e8ff47]/60">
                    <span className="text-white/30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="uppercase tracking-tight">Tenant_id generated: {tenantId.slice(0, 12)}...</span>
                  </li>
                )}
                {totpSecret && (
                  <li className="flex gap-4 text-[#e8ff47]/60">
                    <span className="text-white/30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="uppercase tracking-tight">MFA payload synced to vault</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="p-4 border-t border-white/7 bg-white/2 text-center">
              <span className="font-data-mono text-[8px] text-white/20 uppercase tracking-[0.2em]">(C) 2026 NEURAL_LINK_SECURE</span>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/7 flex items-center justify-between px-10 h-10 shrink-0">
          <div className="flex gap-8">
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">ID: ENR-99-X</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Build: 2.4.9-stable</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Region: US-EAST-1</span>
          </div>
          <span className="font-data-mono text-[9px] tracking-[0.1em] text-white/12">SESSION_INTEGRITY — NOMINAL</span>
        </div>
      </div>
    </div>
  )
}

