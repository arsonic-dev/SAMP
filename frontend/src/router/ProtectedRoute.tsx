import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  if (!hasHydrated) {
    return null // or a loading spinner
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
