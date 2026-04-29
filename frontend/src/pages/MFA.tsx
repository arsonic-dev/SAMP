import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { authApi, parseUserIdFromJwt, parseRoleFromJwt } from '../api/auth'
import { Loader2 } from 'lucide-react'

export function MFA() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const [challengeToken] = useState(() => sessionStorage.getItem('mfa_challenge') ?? '')
  const [email] = useState(() => sessionStorage.getItem('mfa_email') ?? '')
  const [tenantId] = useState(() => sessionStorage.getItem('mfa_tenant') ?? '')

  useEffect(() => {
    if (!challengeToken) navigate('/login')
    inputRefs.current[0]?.focus()
  }, [challengeToken, navigate])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // Auto-submit when last digit filled
    if (index === 5 && value) {
      const code = [...newOtp.slice(0, 5), value.slice(-1)].join('')
      if (code.length === 6) handleVerify(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code?: string) => {
    const totpCode = code ?? otp.join('')
    if (totpCode.length !== 6) return
    setLoading(true)
    setError(null)

    try {
      const resp = await authApi.mfaVerify(challengeToken, totpCode)
      const tok = resp.data
      setAuth(
        { accessToken: tok.accessToken, refreshToken: tok.refreshToken },
        {
          id: parseUserIdFromJwt(tok.accessToken),
          email,
          tenantId: tok.tenantId,
          role: parseRoleFromJwt(tok.accessToken),
        }
      )
      sessionStorage.removeItem('mfa_challenge')
      sessionStorage.removeItem('mfa_email')
      sessionStorage.removeItem('mfa_tenant')
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid OTP code. Please try again.')
      setShake(true)
      setOtp(Array(6).fill(''))
      setTimeout(() => {
        setShake(false)
        inputRefs.current[0]?.focus()
      }, 600)
    } finally {
      setLoading(false)
    }
  }

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
              <div className="w-[5px] h-[5px] rounded-full bg-error animate-pulse"></div>
              <span className="font-data-mono text-[10px] tracking-[0.12em] text-error uppercase">MFA Challenge Required</span>
            </div>
          </div>
          <div className="font-data-mono text-[10px] text-white/25 tracking-[0.08em]">
            {new Date().toLocaleTimeString([], { hour12: false, timeZoneName: 'short' })}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] min-h-0 overflow-hidden">
          {/* LEFT COL: IDENTITY PROTOCOL */}
          <div className="border-r border-white/7 flex flex-col justify-center px-10 gap-7 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">Secure_Channel</span>
                <h2 className="font-display-wordmark text-[24px] text-[#f0ede6] leading-none tracking-widest uppercase">Identity Protocol</h2>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

              <div className="border border-white/12 p-4 bg-white/2 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">REQ_ID</span>
                  <span className="font-data-mono text-[11px] text-white/70 tracking-tighter">AUTH-994-XQ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">TIMESTAMP</span>
                  <span className="font-data-mono text-[11px] text-white/70 tracking-tighter">
                    {new Date().toISOString().split('T')[0].replace(/-/g, '.')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">TARGET_NODE</span>
                  <span className="font-data-mono text-[11px] text-white/70 tracking-tighter">CORE_DB_01</span>
                </div>
              </div>

              <div className="border border-[#e8ff47]/30 bg-[#e8ff47]/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#e8ff47]"></div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#e8ff47] text-[20px] animate-pulse">warning</span>
                  <div className="flex flex-col">
                    <span className="font-data-mono text-[8px] text-[#e8ff47] uppercase tracking-[0.1em]">Status</span>
                    <span className="font-data-mono text-[11px] text-white font-bold uppercase tracking-tight">Awaiting_Verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: AUTHENTICATION CHALLENGE */}
          <div className="flex flex-col justify-center px-10 relative z-20">
            <div className="w-full flex flex-col items-center gap-10">
              <div className="text-center flex flex-col gap-4">
                <div className="relative inline-block mx-auto">
                  <span className="material-symbols-outlined text-[64px] text-[#e8ff47] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
                  <div className="absolute inset-0 bg-[#e8ff47]/10 blur-xl rounded-full"></div>
                </div>
                <h1 className="font-display-wordmark text-[24px] text-[#f0ede6] tracking-[0.1em] leading-none uppercase">Authentication Challenge</h1>
                <p className="font-data-mono text-[10px] text-white/40 max-w-sm mx-auto uppercase tracking-wide">
                  Enter the 6-digit one-time passcode from your secure hardware token to proceed.
                </p>
                {email && <p className="font-data-mono text-[10px] text-[#e8ff47]/60 tracking-wider">USER: {email}</p>}
              </div>

              {/* OTP Input */}
              <div className="space-y-6 w-full">
                <motion.div 
                  animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex gap-3 justify-center"
                >
                  {otp.map((digit, i) => (
                    <div key={i} className={`w-12 h-16 bg-white/3 border transition-all duration-300 flex items-center justify-center relative ${digit ? 'border-[#e8ff47]/40 bg-[#e8ff47]/2' : 'border-white/10'}`}>
                      <input
                        ref={(el) => { inputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="absolute inset-0 w-full h-full bg-transparent text-center font-data-mono text-[24px] font-bold text-[#e8ff47] outline-none appearance-none"
                      />
                      <div className={`absolute inset-x-0 bottom-0 h-[2px] bg-[#e8ff47] transition-transform duration-300 ${digit || (i === otp.findIndex(d => !d)) ? 'scale-x-100 shadow-[0_0_8px_#e8ff47]' : 'scale-x-0'}`}></div>
                    </div>
                  ))}
                </motion.div>

                {error && (
                  <div className="bg-error/10 border border-error/20 p-3 flex gap-3 animate-shake justify-center">
                    <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                    <span className="font-data-mono text-[10px] text-error uppercase leading-relaxed">{error}</span>
                  </div>
                )}

                <button 
                  onClick={() => handleVerify()}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-[#e8ff47] hover:bg-[#d4ea30] disabled:opacity-50 transition-all h-12 flex items-center justify-between px-8 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <span className="font-display-wordmark text-[16px] text-[#0a0a0a] tracking-widest relative z-10">
                    {loading ? 'VERIFYING...' : 'VERIFY_IDENTITY'}
                  </span>
                  <span className="material-symbols-outlined text-[#0a0a0a] group-hover:translate-x-1 transition-transform relative z-10 text-[18px]">arrow_forward</span>
                </button>

                <div className="flex justify-center items-center gap-2 text-white/20 hover:text-white/50 cursor-pointer transition-colors group">
                  <span className="material-symbols-outlined text-[14px] group-hover:rotate-180 transition-transform duration-500">sync</span>
                  <span className="font-data-mono text-[9px] uppercase tracking-[0.1em]">Resend_Token_Signal</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COL: THREAT ANALYSIS */}
          <div className="border-l border-white/7 flex flex-col justify-center px-10 gap-8 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2">
              <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">Active_Monitor</span>
              <h2 className="font-display-wordmark text-[32px] text-[#f0ede6] leading-none tracking-widest uppercase">Threat Analysis</h2>
            </div>

            <div className="border border-white/12 flex flex-col">
              <div className="bg-white/5 border-b border-white/12 p-2 flex justify-between items-center">
                <span className="font-data-mono text-[8px] text-white/30 uppercase">Parameter</span>
                <span className="font-data-mono text-[8px] text-white/30 uppercase">Value</span>
              </div>
              <div className="p-4 space-y-3 bg-white/2">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-data-mono text-[10px] text-white/40 uppercase">Attempts_Remaining</span>
                  <span className="font-data-mono text-[11px] text-[#e8ff47]">2 / 3</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-data-mono text-[10px] text-white/40 uppercase">IP_Origin</span>
                  <span className="font-data-mono text-[11px] text-white/70">192.168.1.104</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-data-mono text-[10px] text-white/40 uppercase">Threat_Level</span>
                  <span className="font-data-mono text-[10px] text-error border border-error px-1.5 py-0.5 font-bold uppercase">Elevated</span>
                </div>
              </div>
            </div>

            {/* System Logs */}
            <div className="space-y-2 pt-4 border-t border-white/7">
              <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.1em] block mb-2">System_Logs</span>
              <div className="font-data-mono text-[9px] text-white/20 flex justify-between">
                <span>[14:02:11] INITIATING AUTH SEQUENCE...</span>
                <span className="text-[#e8ff47]/50">OK</span>
              </div>
              <div className="font-data-mono text-[9px] text-white/20 flex justify-between">
                <span>[14:02:12] GENERATING OTP CHALLENGE...</span>
                <span className="text-[#e8ff47]/50">OK</span>
              </div>
              <div className="font-data-mono text-[9px] text-white/20 flex justify-between">
                <span>[14:02:12] TRANSMITTING TO TOKEN...</span>
                <span className="text-[#e8ff47]/50">OK</span>
              </div>
              {error && (
                <div className="font-data-mono text-[9px] text-error flex justify-between animate-pulse">
                  <span>[14:02:25] AUTH_FAILED: INCORRECT_CODE</span>
                  <span>ERR</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/7 flex items-center justify-between px-10 h-10 shrink-0">
          <div className="flex gap-8">
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">ID: MFA-994-X</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Protocol: SAMP_2.0</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Status: Encrypted</span>
          </div>
          <span className="font-data-mono text-[9px] tracking-[0.1em] text-white/12 uppercase">End-to-End Encryption Active</span>
        </div>
      </div>
    </div>
  )
}

