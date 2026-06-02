import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase.js'
import { hasRole, isAdmin as checkAdmin, isSuperAdmin as checkSuperAdmin, isTeamMember as checkTeamMember } from '../lib/roles.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    // Only overwrite profile if we got data — never clear a valid session on network blip
    if (data) setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to explicit sign-out — token refreshes etc. should not clear state
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const role = profile?.role ?? null

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      isLoggedIn: !!user,
      isAdmin: checkAdmin(role),
      isSuperAdmin: checkSuperAdmin(role),
      isTeamMember: checkTeamMember(role),
      hasRole: (r) => hasRole(role, r),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
