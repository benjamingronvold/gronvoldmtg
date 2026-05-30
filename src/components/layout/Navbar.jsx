import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

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
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <span className="text-xs text-mtg-muted hidden sm:block">
                {user?.user_metadata?.full_name ?? user?.email}
              </span>
              {isSuperAdmin && (
                <Link
                  to="/admin"
                  title="Systeminnstillinger"
                  className={`transition-colors ${location.pathname.startsWith('/admin') ? 'text-mtg-gold' : 'text-mtg-muted hover:text-mtg-text'}`}
                >
                  <SettingsIcon />
                </Link>
              )}
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
