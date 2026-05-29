import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Home() {
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-2xl">
        <h1 className="font-display text-5xl sm:text-6xl font-bold text-gold-gradient mb-4 leading-tight">
          MTG App
        </h1>
        <p className="text-mtg-muted text-lg mb-12">
          Tools for competitive Magic: The Gathering players
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/find-the-line"
            className="group block p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all duration-200"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-display text-mtg-gold font-semibold mb-2">Find the Line</h3>
            <p className="text-mtg-muted text-sm">
              Train your Amulet Titan combo lines with interactive puzzles
            </p>
            <div className="mt-4 text-xs text-mtg-muted group-hover:text-mtg-gold transition-colors">
              Free to play →
            </div>
          </Link>

          <Link
            to={isLoggedIn ? '/tracker' : '/login'}
            className="group block p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all duration-200"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-display text-mtg-gold font-semibold mb-2">Match Tracker</h3>
            <p className="text-mtg-muted text-sm">
              Log results and track win rates across every matchup
            </p>
            <div className="mt-4 text-xs text-mtg-muted group-hover:text-mtg-gold transition-colors">
              {isLoggedIn ? 'View tracker →' : 'Log in to access →'}
            </div>
          </Link>

          <Link
            to={isLoggedIn ? '/meta' : '/login'}
            className="group block p-6 bg-mtg-card border border-mtg-border rounded-xl hover:border-mtg-gold/50 transition-all duration-200"
          >
            <div className="text-3xl mb-3">🗺️</div>
            <h3 className="font-display text-mtg-gold font-semibold mb-2">Meta Analyser</h3>
            <p className="text-mtg-muted text-sm">
              Map tournament fields and predict the expected metagame
            </p>
            <div className="mt-4 text-xs text-mtg-muted group-hover:text-mtg-gold transition-colors">
              Team members only →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
