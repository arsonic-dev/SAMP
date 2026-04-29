import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

interface NavItem {
  to: string
  icon: string
  label: string
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: 'speed', label: 'Command Center' },
  { to: '/dashboard/policy', icon: 'key_visualizer', label: 'Access Matrix' },
  { to: '/dashboard/audit', icon: 'history_edu', label: 'Audit Stream' },
  { to: '/dashboard/risk', icon: 'hub', label: 'Network Nodes' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // ignore
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <aside className="absolute left-0 top-0 w-64 h-full z-40 flex flex-col bg-black border-r border-[#E8FF47]/20 font-mono uppercase text-xs font-bold">
      {/* Header */}
      <div className="p-6 border-b border-[#E8FF47]/20 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 border border-white/12 flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-[#E8FF47]/50">person</span>
        </div>
        <div className="overflow-hidden">
          <div className="text-[#E8FF47] tracking-wider truncate max-w-[140px]">{user?.email?.split('@')[0] || 'OPERATOR_01'}</div>
          <div className="text-[#E8FF47]/40 text-[10px]">{user?.role === 'ADMIN' ? 'ROOT_ACCESS' : 'STANDARD'}</div>
        </div>
      </div>
      
      {/* Scrollable Tabs */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-left w-full transition-colors focus:ring-1 focus:ring-[#E8FF47] ${
                isActive 
                  ? 'bg-[#E8FF47]/10 text-[#E8FF47] border-l-4 border-[#E8FF47]' 
                  : 'text-[#E8FF47]/50 hover:bg-[#E8FF47]/5 hover:text-[#E8FF47] border-l-4 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E8FF47]/20 flex flex-col gap-2">
        <button className="w-full border border-error/50 text-error hover:bg-error/10 py-2 font-status-ui text-status-ui tracking-widest uppercase transition-colors rounded-none">
            EMERGENCY_SHUTDOWN
        </button>
        <div className="flex gap-2 mt-2">
          <button className="flex-1 flex justify-center items-center gap-2 text-[#E8FF47]/50 py-2 hover:bg-[#E8FF47]/5 hover:text-[#E8FF47] transition-colors border border-transparent">
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span className="sr-only">SETTINGS</span>
          </button>
          <button onClick={handleLogout} className="flex-1 flex justify-center items-center gap-2 text-[#E8FF47]/50 py-2 hover:bg-[#E8FF47]/5 hover:text-[#E8FF47] transition-colors border border-transparent">
            <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
            <span className="sr-only">LOGOUT</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
