import { useState } from 'react'
import MatchForm from '../components/match-tracker/MatchForm.jsx'
import MatchHistory from '../components/match-tracker/MatchHistory.jsx'
import StatsPanel from '../components/match-tracker/StatsPanel.jsx'
import { useMatches } from '../hooks/useMatches.js'

export default function MatchTracker() {
  const { matches, loading } = useMatches()
  const [tab, setTab] = useState('stats')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-mtg-text">Match Tracker</h1>
        <span className="text-mtg-muted text-sm">{matches.length} matches logged</span>
      </div>

      <div className="grid lg:grid-cols-[340px,1fr] gap-8 items-start">
        <MatchForm onSuccess={() => setTab('history')} />

        <div className="space-y-4">
          <div className="flex gap-1 bg-mtg-card border border-mtg-border rounded-lg p-1 w-fit">
            {['stats', 'history'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-all
                  ${tab === t ? 'bg-mtg-gold text-mtg-bg' : 'text-mtg-muted hover:text-mtg-text'}`}
              >
                {t === 'stats' ? 'Statistics' : 'History'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-mtg-muted animate-pulse">Loading matches…</div>
          ) : tab === 'stats' ? (
            <StatsPanel matches={matches} />
          ) : (
            <MatchHistory />
          )}
        </div>
      </div>
    </div>
  )
}
