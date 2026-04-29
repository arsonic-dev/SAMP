import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { authApi, parseUserIdFromJwt, parseRoleFromJwt } from '../api/auth'
import { Loader2 } from 'lucide-react'

export function Login() {
  const location = useLocation()
  const prefill = (location.state as { tenantId?: string; email?: string } | null) ?? {}

  const [tenantId, setTenantId] = useState(prefill.tenantId ?? '')
  const [email, setEmail] = useState(prefill.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const resp = await authApi.login(tenantId, email, password)
      const data = resp.data

      if (data.mfaRequired && data.challengeToken) {
        sessionStorage.setItem('mfa_challenge', data.challengeToken)
        sessionStorage.setItem('mfa_email', email)
        sessionStorage.setItem('mfa_tenant', tenantId)
        navigate('/mfa')
        return
      }

      if (data.tokens) {
        const tok = data.tokens
        setAuth(
          { accessToken: tok.accessToken, refreshToken: tok.refreshToken },
          {
            id: parseUserIdFromJwt(tok.accessToken),
            email,
            tenantId: tok.tenantId,
            role: parseRoleFromJwt(tok.accessToken),
          }
        )
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      if (e.response?.status === 400) {
        setError('Invalid request — check your Tenant ID, email, and password')
      } else if (e.response?.status === 401) {
        setError('Invalid credentials')
      } else {
        setError(e.response?.data?.message ?? 'Network error — is the backend running?')
      }
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
              <div className="w-[5px] h-[5px] rounded-full bg-[#e8ff47] animate-pulse"></div>
              <span className="font-data-mono text-[10px] tracking-[0.12em] text-[#e8ff47] uppercase">Tunnel Active</span>
            </div>
          </div>
          <div className="font-data-mono text-[10px] text-white/25 tracking-[0.08em]">
            {new Date().toLocaleTimeString([], { hour12: false, timeZoneName: 'short' })}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] min-h-0 overflow-hidden">
          {/* LEFT COL */}
          <div className="border-r border-white/7 flex flex-col justify-center px-10 gap-7 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-7">
              <div>
                <div className="font-data-mono text-[9px] tracking-[0.2em] text-white/25 uppercase mb-1.5">Node</div>
                <div className="font-data-mono text-[12px] text-white/60 uppercase">STATION_ALPHA</div>
              </div>
              <div className="w-px h-[60px] bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
              <div>
                <div className="font-data-mono text-[9px] tracking-[0.2em] text-white/25 uppercase mb-1.5">Sector</div>
                <div className="font-data-mono text-[12px] text-white/60 uppercase">07 / <span className="text-[#e8ff47]">ACTIVE</span></div>
              </div>
              <div className="w-px h-[60px] bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
              <div>
                <div className="font-data-mono text-[9px] tracking-[0.2em] text-white/25 uppercase mb-1.5">IP Resolve</div>
                <div className="font-data-mono text-[12px] text-white/60 uppercase">192.168.1.104</div>
              </div>
              <div className="w-px h-[60px] bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
              <div>
                <div className="font-data-mono text-[9px] tracking-[0.2em] text-white/25 uppercase mb-1.5">Latency</div>
                <div className="font-data-mono text-[12px] text-white/60 uppercase"><span className="text-[#e8ff47]">18</span> ms</div>
              </div>
            </div>
          </div>

          {/* CENTER: LOGIN FORM */}
          <div className="flex flex-col justify-center px-10 py-15 overflow-y-auto custom-scrollbar">
            <div className="mb-1">
              <div className="font-display-wordmark text-[24px] tracking-[0.04em] text-[#f0ede6] leading-none">
                SAMP<span className="text-[#e8ff47]">_</span>PRO<span className="text-[#f0ede6]">TOCOL</span>
              </div>
              <div className="font-data-mono text-[10px] tracking-[0.18em] text-white/30 uppercase mt-1">
                Secure Tunnel Auth — Station Alpha
              </div>
            </div>

            <div className="w-full h-px bg-white/10 my-10"></div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center font-data-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">
                  <span>Tenant ID</span>
                  <span className="border border-white/15 px-1.5 py-0.5 text-white/30 text-[8px]">Required</span>
                </div>
                <input
                  type="text"
                  className="w-full bg-white/3 border border-white/12 text-[#f0ede6] font-data-mono text-[12px] px-3 py-2.5 outline-none focus:border-[#e8ff47]/50 focus:bg-[#e8ff47]/2 transition-all tracking-[0.04em]"
                  placeholder="ENTER_TENANT_NODE"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center font-data-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">
                  <span>Authorized Email</span>
                  <span className="border border-white/15 px-1.5 py-0.5 text-white/30 text-[8px]">Required</span>
                </div>
                <input
                  type="email"
                  className="w-full bg-white/3 border border-white/12 text-[#f0ede6] font-data-mono text-[12px] px-3 py-2.5 outline-none focus:border-[#e8ff47]/50 focus:bg-[#e8ff47]/2 transition-all tracking-[0.04em]"
                  placeholder="user@samp.network"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center font-data-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">
                  <span>Access Key (Password)</span>
                  <span className="border border-[#e8ff47]/30 px-1.5 py-0.5 text-[#e8ff47]/50 text-[8px]">Encrypted</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-white/3 border border-white/10 px-3 py-2.5 font-data-mono text-[12px] text-white focus:border-[#e8ff47]/50 outline-none transition-all placeholder:text-white/10"
                    placeholder="ENTER_PASSPHRASE"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 font-data-mono text-[9px] text-white/30 hover:text-[#e8ff47] uppercase tracking-[0.1em] transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 p-3 flex gap-3 animate-shake">
                  <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                  <span className="font-data-mono text-[10px] text-error uppercase leading-relaxed">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8ff47] hover:bg-[#d4ea30] active:scale-[0.99] transition-all py-2.5 text-[#0a0a0a] font-display-wordmark text-[14px] tracking-[0.2em] flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <span>{loading ? 'Processing...' : 'Authenticate'}</span>
                  <span className="text-[16px] group-hover:translate-x-1 transition-transform">→</span>
                </div>
                {loading && <div className="absolute inset-0 bg-white/10 animate-shimmer"></div>}
              </button>

              <div className="flex justify-between items-center mt-5">
                <button type="button" className="font-data-mono text-[10px] text-white/30 hover:text-white/70 uppercase tracking-[0.1em] transition-colors">
                  Forgot key
                </button>
                <Link to="/register" className="font-data-mono text-[10px] text-white/30 hover:text-white/70 uppercase tracking-[0.1em] transition-colors">
                  REGISTER USER
                </Link>
              </div>
            </form>
          </div>

          {/* RIGHT COL: THREAT MONITOR */}
          <div className="border-l border-white/7 flex flex-col justify-center px-10 overflow-y-auto custom-scrollbar">
            <div className="border border-white/8 p-5">
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/8">
                <span className="font-data-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">Threat Monitor</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#e8ff47] animate-pulse"></div>
                  <span className="font-data-mono text-[9px] text-[#e8ff47] tracking-[0.1em]">LOW</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline py-2 border-b border-white/5">
                  <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.1em]">Auth Attempts</span>
                  <span className="font-data-mono text-[11px] text-[#e8ff47]">0 / hr</span>
                </div>
                <div className="flex justify-between items-baseline py-2 border-b border-white/5">
                  <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.1em]">Tunnel Integrity</span>
                  <span className="font-data-mono text-[11px] text-[#e8ff47]">100%</span>
                </div>
                <div className="flex justify-between items-baseline py-2 border-b border-white/5">
                  <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.1em]">Packet Loss</span>
                  <span className="font-data-mono text-[11px] text-[#e8ff47]">0.00%</span>
                </div>
                <div className="flex justify-between items-baseline py-2 border-b border-white/5">
                  <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.1em]">Cert Expiry</span>
                  <span className="font-data-mono text-[11px] text-white/70">47d</span>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                <div className="font-data-mono text-[9px] text-white/20 tracking-[0.06em]">
                  <span className="opacity-60">[09:14:02]</span> TUNNEL_INIT <span className="text-[#e8ff47]/50">OK</span>
                </div>
                <div className="font-data-mono text-[9px] text-white/20 tracking-[0.06em]">
                  <span className="opacity-60">[09:14:03]</span> CERT_VERIFY <span className="text-[#e8ff47]/50">OK</span>
                </div>
                <div className="font-data-mono text-[9px] text-white/20 tracking-[0.06em]">
                  <span className="opacity-60">[09:14:03]</span> AWAIT_AUTH_INPUT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/7 flex items-center justify-between px-10 h-10 shrink-0">
          <div className="flex gap-8">
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">ID: 4402-99-X</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Build: 2.0.4-stable</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Region: Sector 07</span>
          </div>
          <span className="font-data-mono text-[9px] tracking-[0.1em] text-white/12">INTEGRITY_SCAN — NOMINAL</span>
        </div>
      </div>
    </div>
  )
}

