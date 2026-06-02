import { useState } from 'react'
import MatchForm from '../components/match-tracker/MatchForm.jsx'
import MatchHistory from '../components/match-tracker/MatchHistory.jsx'
import StatsPanel from '../components/match-tracker/StatsPanel.jsx'
import CsvImport from '../components/match-tracker/CsvImport.jsx'
import BulkEntry from '../components/match-tracker/BulkEntry.jsx'
import DeckManager from '../components/match-tracker/DeckManager.jsx'
import { useMatches } from '../hooks/useMatches.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function MatchTracker() {
  const { matches, loading, addMatch, refresh } = useMatches()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('stats')
  const TABS = [['stats', 'Statistikk'], ['history', 'Historikk'], ['decks', 'Dekker']]
  const [panel, setPanel] = useState(null) // null | 'import' | 'bulk'

  function closePanel() { refresh(); setPanel(null) }

  if (panel === 'import') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-mtg-text">Match Tracker</h1>
          <button onClick={closePanel} className="text-sm text-mtg-muted hover:text-mtg-text transition-colors">← Tilbake</button>
        </div>
        <CsvImport addMatch={addMatch} onDone={closePanel} />
      </div>
    )
  }

  if (panel === 'bulk') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-mtg-text">Match Tracker</h1>
          <button onClick={closePanel} className="text-sm text-mtg-muted hover:text-mtg-text transition-colors">← Tilbake</button>
        </div>
        <BulkEntry addMatch={addMatch} onDone={closePanel} />
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
            <>
              <button
                onClick={() => setPanel('bulk')}
                className="text-sm text-mtg-muted hover:text-mtg-text border border-mtg-border rounded px-3 py-1.5 transition-colors"
              >
                Per archetype
              </button>
              <button
                onClick={() => setPanel('import')}
                className="text-sm text-mtg-muted hover:text-mtg-text border border-mtg-border rounded px-3 py-1.5 transition-colors"
              >
                Importer CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px,1fr] gap-8 items-start">
        <MatchForm onSuccess={() => setTab('history')} />

        <div className="space-y-4">
          <div className="flex gap-1 bg-mtg-card border border-mtg-border rounded-lg p-1 w-fit">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all
                  ${tab === key ? 'bg-mtg-gold text-mtg-bg' : 'text-mtg-muted hover:text-mtg-text'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'decks' ? (
            <DeckManager />
          ) : loading ? (
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
