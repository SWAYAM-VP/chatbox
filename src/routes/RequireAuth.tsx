import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, configured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        <div className="glass-panel rounded-3xl px-8 py-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-slate-300">Loading secure session...</p>
        </div>
      </div>
    )
  }

  if (!configured) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}