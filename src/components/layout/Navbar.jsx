import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, isSuperAdmin, isTeamMember } = useAuth()
  const location = useLocation()

  function isActive(path) {
    return location.pathname.startsWith(path)
      ? 'text-mtg-gold border-b border-mtg-gold pb-0.5'
      : 'text-mtg-muted hover:text-mtg-text'
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-mtg-border bg-mtg-bg/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link to="/" className="font-display text-lg font-semibold text-gold-gradient tracking-wide">
          MTG App
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/find-the-line" className={isActive('/find-the-line')}>
            Find the Line
          </Link>

          {isLoggedIn && (
            <>
              <Link to="/tracker" className={isActive('/tracker')}>
                Match Tracker
              </Link>
              {isTeamMember && (
                <Link to="/meta" className={isActive('/meta')}>
                  Meta
                </Link>
              )}
              {isSuperAdmin && (
                <Link to="/admin" className={isActive('/admin')}>
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <span className="text-xs text-mtg-muted hidden sm:block">
                {user?.user_metadata?.full_name ?? user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-mtg-muted hover:text-mtg-text transition-colors border border-mtg-border rounded px-2.5 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-mtg-gold text-mtg-bg font-semibold text-xs px-3 py-1.5 rounded hover:brightness-110 transition-all"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
