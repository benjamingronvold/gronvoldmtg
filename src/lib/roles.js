export const ROLE_HIERARCHY = {
  bruker: 0,
  teammedlem: 1,
  admin: 2,
  superadmin: 3,
}

export const ROLES = ['bruker', 'teammedlem', 'admin', 'superadmin']

export function hasRole(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function isAdmin(role) {
  return hasRole(role, 'admin')
}

export function isSuperAdmin(role) {
  return hasRole(role, 'superadmin')
}

export function isTeamMember(role) {
  return hasRole(role, 'teammedlem')
}
