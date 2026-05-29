import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { hasRole } from '../../lib/roles.js'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-mtg-muted animate-pulse font-display">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(role, requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">🔒</div>
        <h2 className="font-display text-xl text-mtg-text">Access Denied</h2>
        <p className="text-mtg-muted text-sm">
          You need the <span className="text-mtg-gold">{requiredRole}</span> role to access this page.
        </p>
      </div>
    )
  }

  return children
}
