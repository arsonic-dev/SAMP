import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './router/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { MFA } from './pages/MFA'
import { Dashboard } from './pages/Dashboard'
import { Unauthorized } from './pages/Unauthorized'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-background relative overflow-hidden shadow-2xl border border-white/5">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/mfa" element={<MFA />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </QueryClientProvider>
  )
}
