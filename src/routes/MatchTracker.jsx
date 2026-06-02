import { useState, useMemo } from 'react'
import MatchForm from '../components/match-tracker/MatchForm.jsx'
import MatchHistory from '../components/match-tracker/MatchHistory.jsx'
import StatsPanel from '../components/match-tracker/StatsPanel.jsx'
import CsvImport from '../components/match-tracker/CsvImport.jsx'
import BulkEntry from '../components/match-tracker/BulkEntry.jsx'
import DeckManager from '../components/match-tracker/DeckManager.jsx'
import { useMatches } from '../hooks/useMatches.js'
import { useAuth } from '../hooks/useAuth.jsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MatchTracker() {
  const { matches, loading, addMatch, deleteMatch, deleteMatches, refresh } = useMatches()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('stats')
  const [panel, setPanel] = useState(null)

  // Filters (shared across stats + history tabs)
  const currentYear = new Date().getFullYear()
  const [deckFilter, setDeckFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [monthFilter, setMonthFilter] = useState('')

  const availableDecks = useMemo(() => {
    const decks = [...new Set(matches.map(m => m.my_deck).filter(Boolean))].sort()
    return decks
  }, [matches])

  const availableYears = useMemo(() => {
    const years = [...new Set(matches.map(m => m.played_at?.slice(0, 4)))].filter(Boolean).sort().reverse()
    return years.length ? years : [String(currentYear)]
  }, [matches, currentYear])

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (deckFilter && (m.my_deck ?? '') !== deckFilter) return false
      if (yearFilter && !m.played_at?.startsWith(yearFilter)) return false
      if (monthFilter && m.played_at?.slice(5, 7) !== String(monthFilter).padStart(2, '0')) return false
      return true
    })
  }, [matches, deckFilter, yearFilter, monthFilter])

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

  const TABS = [['stats', 'Statistikk'], ['history', 'Historikk'], ['decks', 'Dekker']]

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
          {/* Tab bar */}
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

          {/* Filters — only shown on stats and history tabs */}
          {(tab === 'stats' || tab === 'history') && (
            <div className="flex flex-wrap gap-2">
              <select
                value={deckFilter}
                onChange={e => setDeckFilter(e.target.value)}
                className="bg-mtg-card border border-mtg-border rounded-lg px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
              >
                <option value="">Alle dekker</option>
                {availableDecks.map(d => <option key={d} value={d}>{d}</option>)}
                {/* also show matches with no deck assigned */}
                {matches.some(m => !m.my_deck) && <option value="__none__">Uten dekk</option>}
              </select>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="bg-mtg-card border border-mtg-border rounded-lg px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
              >
                <option value="">Alle år</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="bg-mtg-card border border-mtg-border rounded-lg px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
              >
                <option value="">Alle måneder</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              {(deckFilter || yearFilter !== String(currentYear) || monthFilter) && (
                <button
                  onClick={() => { setDeckFilter(''); setYearFilter(String(currentYear)); setMonthFilter('') }}
                  className="text-xs text-mtg-muted hover:text-mtg-gold border border-mtg-border rounded-lg px-3 py-1.5 transition-colors"
                >
                  Nullstill
                </button>
              )}
            </div>
          )}

          {tab === 'decks' ? (
            <DeckManager />
          ) : loading ? (
            <div className="text-center py-12 text-mtg-muted animate-pulse">Laster kamper…</div>
          ) : tab === 'stats' ? (
            <StatsPanel matches={filteredMatches} />
          ) : (
            <MatchHistory
              matches={filteredMatches}
              allMatches={matches}
              deleteMatch={deleteMatch}
              deleteMatches={deleteMatches}
            />
          )}
        </div>
      </div>
    </div>
  )
}
