import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { DashboardHome } from './DashboardHome'
import { PolicyPage } from './PolicyPage'
import { AuditPage } from './AuditPage'
import { RiskMonitorPage } from './RiskMonitorPage'
import { useAuthStore } from '../store/authStore'

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  
  // Try to get the human-readable tenant name from local storage, fallback to the first 8 chars of the ID
  const displayTenantName = user?.tenantId 
    ? (localStorage.getItem(`tenant_name_${user.tenantId}`) || user.tenantId.split('-')[0]) 
    : 'CYBER_CORE'

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#f0ede6] font-data-mono selection:bg-[#E8FF47] selection:text-black overflow-hidden">
      {/* Global Overlays */}
      <div className="absolute inset-0 grid-overlay z-0 pointer-events-none opacity-20"></div>
      <div className="absolute inset-0 scanline-overlay z-[100] mix-blend-overlay opacity-30 pointer-events-none"></div>

      {/* TopNavBar */}
      <nav className="flex-none relative w-full z-50 flex justify-between items-center px-10 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/7 font-data-mono uppercase tracking-tighter text-sm max-w-none">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black text-[#E8FF47] tracking-widest">{displayTenantName.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <input className="cyber-input bg-white/[0.03] border border-white/12 text-[#E8FF47] placeholder:text-[#E8FF47]/20 rounded-none px-3 py-1 font-status-ui text-status-ui focus:outline-none focus:border-[#E8FF47]/50 focus:ring-0" placeholder="SEARCH_INDEX..." type="text"/>
          </div>
          <button className="text-[#E8FF47]/40 hover:text-[#E8FF47] hover:bg-[#E8FF47]/10 transition-all duration-75 p-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>security</span>
          </button>
          <button className="text-[#E8FF47]/40 hover:text-[#E8FF47] hover:bg-[#E8FF47]/10 transition-all duration-75 p-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>account_tree</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 relative w-full overflow-hidden">
        <Sidebar />
        <main className="ml-64 flex-1 h-full relative z-10 w-[calc(100%-256px)] flex flex-col overflow-hidden">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="policy" element={<PolicyPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="risk" element={<RiskMonitorPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="flex-none relative w-full z-50 flex justify-between px-10 py-2 items-center bg-black border-t border-[#E8FF47]/20 font-mono text-[10px] tracking-widest max-w-none pointer-events-none">
        <div className="text-[#E8FF47] font-bold">
            (C) 2024 NEURAL_LINK_SECURE. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  )
}

