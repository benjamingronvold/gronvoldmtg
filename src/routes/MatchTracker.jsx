import { useState } from 'react'
import MatchForm from '../components/match-tracker/MatchForm.jsx'
import MatchHistory from '../components/match-tracker/MatchHistory.jsx'
import StatsPanel from '../components/match-tracker/StatsPanel.jsx'
import CsvImport from '../components/match-tracker/CsvImport.jsx'
import { useMatches } from '../hooks/useMatches.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function MatchTracker() {
  const { matches, loading } = useMatches()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('stats')
  const [showImport, setShowImport] = useState(false)

  if (showImport) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-mtg-text">Match Tracker</h1>
          <button
            onClick={() => setShowImport(false)}
            className="text-sm text-mtg-muted hover:text-mtg-text transition-colors"
          >
            ← Tilbake
          </button>
        </div>
        <CsvImport onDone={() => setShowImport(false)} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-mtg-text">Match Tracker</h1>
        <div className="flex items-center gap-3">
          <span className="text-mtg-muted text-sm">{matches.length} kamper logget</span>
          {isAdmin && (
            <button
              onClick={() => setShowImport(true)}
              className="text-sm text-mtg-muted hover:text-mtg-text border border-mtg-border rounded px-3 py-1.5 transition-colors"
            >
              Importer CSV
            </button>
          )}
        </div>
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
                {t === 'stats' ? 'Statistikk' : 'Historikk'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-mtg-muted animate-pulse">Laster kamper…</div>
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
