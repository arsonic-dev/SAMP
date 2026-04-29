import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  tenantId: string
  role: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  riskScore: number | null
  _hasHydrated: boolean
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: User) => void
  clearAuth: () => void
  setRiskScore: (score: number) => void
  setHasHydrated: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      riskScore: null,
      _hasHydrated: false,
      setAuth: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          riskScore: null,
        }),
      setRiskScore: (score) => set({ riskScore: score }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: 'samp-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
