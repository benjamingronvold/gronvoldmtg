import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Dashboard() {
  const { user, profile, isTeamMember, isSuperAdmin } = useAuth()

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? 'Player'
  const roleBadge = {
    bruker: { label: 'Bruker', color: 'text-mtg-muted border-mtg-border' },
    teammedlem: { label: 'Team Member', color: 'text-blue-400 border-blue-800' },
    admin: { label: 'Admin', color: 'text-mtg-gold border-mtg-gold/50' },
    superadmin: { label: 'Super Admin', color: 'text-purple-400 border-purple-800' },
  }[profile?.role] ?? { label: 'Loading…', color: 'text-mtg-muted border-mtg-border' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl text-mtg-text mb-1">
          Welcome back, {displayName}
        </h1>
        <span className={`inline-block text-xs border rounded-full px-2.5 py-0.5 ${roleBadge.color}`}>
          {roleBadge.label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/tracker"
          className="group p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all"
        >
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-display text-lg text-mtg-gold mb-1">Match Tracker</h3>
          <p className="text-mtg-muted text-sm">Log matches and view win rate statistics</p>
        </Link>

        <Link
          to="/find-the-line"
          className="group p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all"
        >
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-display text-lg text-mtg-gold mb-1">Find the Line</h3>
          <p className="text-mtg-muted text-sm">Practice Amulet Titan combo sequences</p>
        </Link>

        {isTeamMember && (
          <Link
            to="/meta"
            className="group p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-display text-lg text-mtg-gold mb-1">Meta Analyser</h3>
            <p className="text-mtg-muted text-sm">Build tournament fields and map expected meta</p>
          </Link>
        )}

        {isSuperAdmin && (
          <Link
            to="/admin"
            className="group p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-purple-800/50 transition-all"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-display text-lg text-purple-400 mb-1">Admin Panel</h3>
            <p className="text-mtg-muted text-sm">Manage user roles and permissions</p>
          </Link>
        )}
      </div>
    </div>
  )
}
