import { useAuth } from '../../hooks/useAuth.jsx'
import { hasRole } from '../../lib/roles.js'

export default function RoleGate({ requiredRole, children, fallback = null }) {
  const { role } = useAuth()
  if (!hasRole(role, requiredRole)) return fallback
  return children
}
