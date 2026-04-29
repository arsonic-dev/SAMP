import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft } from 'lucide-react'

export function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="h-full w-full relative flex flex-col bg-[#0a0a0a] text-[#f0ede6] overflow-hidden font-sans">
      {/* Visual Underlays */}
      <div className="absolute inset-0 grid-overlay z-0 pointer-events-none opacity-20"></div>
      <div className="absolute inset-0 scanline-overlay z-0 mix-blend-overlay opacity-30 pointer-events-none"></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* TOP BAR */}
        <div className="border-b border-white/12 flex items-center justify-between px-10 h-[52px] shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-data-mono text-[10px] tracking-[0.15em] text-white/35 uppercase">SAMP_PROTOCOL / LOCKDOWN_MODE</span>
            <div className="w-[1px] h-4 bg-white/12"></div>
            <div className="flex items-center gap-2">
              <div className="w-[5px] h-[5px] rounded-full bg-error animate-pulse"></div>
              <span className="font-data-mono text-[10px] tracking-[0.12em] text-error uppercase">Security Alert: Level 5</span>
            </div>
          </div>
          <div className="font-data-mono text-[10px] text-white/25 tracking-[0.08em]">
            SYSTEM_LOCKED // {new Date().toLocaleTimeString([], { hour12: false })}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-[1fr_600px_1fr] min-h-0 overflow-hidden">
          {/* LEFT COL: VIOLATION_METADATA */}
          <div className="border-r border-white/7 flex flex-col justify-center px-10 gap-7 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">Violation_Metadata</span>
                <h2 className="font-display-wordmark text-[32px] text-[#f0ede6] leading-none tracking-widest uppercase">Breach Details</h2>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

              <div className="space-y-4">
                <div className="border border-white/12 p-4 bg-white/2 space-y-3">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase block">Attempt_IP</span>
                  <span className="font-data-mono text-[12px] text-[#e8ff47]">192.168.0.244 [EXT]</span>
                </div>
                
                <div className="border border-white/12 p-4 bg-white/2 space-y-3">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase block">Failure_Code</span>
                  <span className="font-data-mono text-[12px] text-white/70 tracking-tighter">ERR_AUTH_0x99A_INVALID_KEY</span>
                </div>

                <div className="border border-error/30 bg-error/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                  <div className="flex flex-col">
                    <span className="font-data-mono text-[8px] text-error uppercase tracking-[0.1em] mb-1">Severity</span>
                    <span className="font-data-mono text-[12px] text-white font-bold uppercase tracking-tight">CRITICAL_BREACH</span>
                  </div>
                </div>

                <div className="border border-white/12 p-4 bg-white/2 space-y-3">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase block">Target_Node</span>
                  <span className="font-data-mono text-[12px] text-white/70">CORE_MAINFRAME_01</span>
                </div>
              </div>

              <div className="mt-4 border border-white/10 p-4 flex gap-4 items-center bg-white/5">
                <span className="material-symbols-outlined text-white/30 text-[24px]">fingerprint</span>
                <div className="flex flex-col">
                  <span className="font-data-mono text-[8px] text-white/30 uppercase">Operator_ID</span>
                  <span className="font-data-mono text-[10px] text-error uppercase font-bold tracking-wider">Unrecognized_Entity</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: LOCKDOWN HUD */}
          <div className="flex flex-col justify-center px-10 relative z-20">
            <div className="w-full flex flex-col items-center gap-10">
              <div className="relative flex justify-center items-center">
                <div className="absolute inset-0 bg-error/20 blur-[60px] rounded-full animate-pulse"></div>
                <div className="relative z-10 w-32 h-32 border border-error/30 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                {/* Crosshair effect */}
                <div className="absolute w-[200%] h-px bg-error/10"></div>
                <div className="absolute h-[200%] w-px bg-error/10"></div>
              </div>

              <div className="text-center flex flex-col gap-2">
                <div className="relative inline-block">
                   <h1 className="font-display-wordmark text-[64px] text-error leading-none tracking-tighter drop-shadow-[0_0_15px_#ff3b3b]">ACCESS DENIED</h1>
                   <div className="mt-4 flex justify-center gap-2">
                    <span className="h-1 w-8 bg-error"></span>
                    <span className="h-1 w-2 bg-error"></span>
                    <span className="h-1 w-32 bg-error"></span>
                  </div>
                </div>
                <p className="font-data-mono text-[11px] text-error/80 uppercase tracking-[0.2em] mt-6 py-4 border-y border-error/20 bg-error/5 px-4 leading-relaxed">
                  Security protocol Alpha-7 initiated. System functions suspended. Unauthorized terminal interaction logged.
                </p>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-[#e8ff47] hover:bg-[#d4ea30] transition-all h-16 flex items-center justify-between px-8 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="font-display-wordmark text-[20px] text-[#0a0a0a] tracking-widest relative z-10">INITIATE_OVERRIDE</span>
                  <span className="material-symbols-outlined text-[#0a0a0a] group-hover:translate-x-1 transition-transform relative z-10">arrow_forward</span>
                </button>
                
                <p className="font-data-mono text-[9px] text-white/20 text-center uppercase">
                  Click override to return to safe sector
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COL: SECURITY_ADMINISTRATION */}
          <div className="border-l border-white/7 flex flex-col justify-center px-10 gap-8 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2">
              <span className="font-data-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">Security_Administration</span>
              <h2 className="font-display-wordmark text-[32px] text-[#f0ede6] leading-none tracking-widest uppercase">Event Stream</h2>
            </div>

            <div className="flex-1 bg-black/40 border border-white/7 p-4 font-data-mono text-[10px] space-y-2 overflow-y-auto custom-scrollbar">
              <div className="flex gap-3 text-white/30">
                <span className="shrink-0">[14:01:42]</span>
                <span className="truncate">AUTH_REQUEST_RECEIVED</span>
              </div>
              <div className="flex gap-3 text-[#e8ff47]/60">
                <span className="shrink-0">[14:01:43]</span>
                <span className="truncate">HANDSHAKE_ESTABLISHED</span>
              </div>
              <div className="flex gap-3 text-white/30">
                <span className="shrink-0">[14:01:45]</span>
                <span className="truncate">VALIDATING_CREDENTIALS</span>
              </div>
              <div className="flex gap-3 text-error bg-error/10 border-l-2 border-error px-2 py-1">
                <span className="shrink-0">[14:01:48]</span>
                <span className="font-bold">KEY_MISMATCH_DETECTED</span>
              </div>
              <div className="flex gap-3 text-white/30">
                <span className="shrink-0">[14:01:48]</span>
                <span>RETRY_ATTEMPT_1</span>
              </div>
              <div className="flex gap-3 text-error bg-error/10 border-l-2 border-error px-2 py-1">
                <span className="shrink-0">[14:01:50]</span>
                <span className="font-bold">KEY_MISMATCH_DETECTED</span>
              </div>
              <div className="flex gap-3 text-error bg-error/20 border-l-4 border-error px-2 py-1">
                <span className="shrink-0">[14:01:52]</span>
                <span className="font-bold">MAX_RETRIES_EXCEEDED</span>
              </div>
              <div className="flex gap-3 text-[#e8ff47] bg-[#e8ff47]/10 border-l-2 border-[#e8ff47] px-2 py-1">
                <span className="shrink-0">[14:01:53]</span>
                <span>LOCKDOWN_PROTOCOL_INIT</span>
              </div>
              <div className="flex gap-3 text-white/20">
                <span className="shrink-0">[14:01:54]</span>
                <span>SEVERING_CONNECTION...</span>
              </div>
              <div className="flex gap-3 text-error animate-pulse">
                <span className="shrink-0">[14:01:55]</span>
                <span className="font-bold">SYSTEM_LOCKED</span>
              </div>
            </div>

            {/* Glitch Block */}
            <div className="h-16 border border-error/20 bg-error/5 p-3 flex items-center overflow-hidden opacity-40">
              <span className="font-data-mono text-[9px] text-error break-all leading-tight">
                0x00FF 0x00FE 0x1A2B 0xERROR 0xNULL 0xVOID 0xDEAD 0xBADF00D
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/7 flex items-center justify-between px-10 h-10 shrink-0">
          <div className="flex gap-8">
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Node: LOCK-994-X</span>
            <span className="font-data-mono text-[9px] tracking-[0.12em] text-white/20 uppercase">Status: Terminal Lockdown</span>
          </div>
          <span className="font-data-mono text-[9px] tracking-[0.1em] text-error/40 uppercase">Unauthorized Access Attempt Logged</span>
        </div>
      </div>
    </div>
  )
}
