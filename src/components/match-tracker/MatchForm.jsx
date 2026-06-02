import { useState, useMemo } from 'react'
import { useMatches } from '../../hooks/useMatches.js'
import { useDecks } from '../../hooks/useDecks.js'

const KNOWN_ARCHETYPES = [
  'Amulet Titan', 'Boros Energy', 'Dimir Frog', 'Living End', 'Murktide Regent',
  'Golgari Yawgmoth', 'Izzet Prowess', 'Mono Green Tron', 'Eldrazi Tron',
  'Rhinos', 'Jund Sagavan', 'Burn', 'Affinity', 'Hammertime', 'UW Control',
  'Jeskai Control', 'Four-Color Omnath', 'Domain Zoo', 'Temur Crasher',
  'Storm', 'Ad Nauseam', 'Mill', 'Merfolk', 'Shadow', 'Hardened Scales',
  'Lantern Control', 'Belcher', 'Creativity', 'Grinding Station', 'Other',
]

const RESULTS = ['2-0', '2-1', '1-2', '0-2', '1-1-0']

export default function MatchForm({ onSuccess }) {
  const { addMatch, matches } = useMatches()
  const { decks } = useDecks()

  const allArchetypes = useMemo(() => {
    const fromHistory = matches.map(m => m.opponent_archetype).filter(Boolean)
    return [...new Set([...KNOWN_ARCHETYPES, ...fromHistory])].sort()
  }, [matches])
  const [form, setForm] = useState({
    my_deck: '',
    opponent_archetype: '',
    result: '',
    played_at: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.opponent_archetype || !form.result) return
    setSaving(true)
    setError(null)
    try {
      await addMatch(form)
      setForm(f => ({ ...f, opponent_archetype: '', result: '', notes: '' }))
      // keep my_deck selected between matches
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-mtg-card border border-mtg-border rounded-xl p-6 space-y-5">
      <h2 className="font-display text-lg text-mtg-gold">Log a Match</h2>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Mitt dekk</label>
        {decks.length > 0 ? (
          <select
            value={form.my_deck}
            onChange={e => setForm(f => ({ ...f, my_deck: e.target.value }))}
            className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-mtg-text text-sm focus:outline-none focus:border-mtg-gold/60"
          >
            <option value="">— Velg dekk —</option>
            {decks.map(d => <option key={d.id} value={d.name}>{d.name} ({d.format})</option>)}
          </select>
        ) : (
          <p className="text-xs text-mtg-muted py-1">
            Ingen dekker registrert. Legg til i <span className="text-mtg-gold">Dekker</span>-fanen.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">
          Opponent Archetype
        </label>
        <input
          list="archetypes"
          value={form.opponent_archetype}
          onChange={e => setForm(f => ({ ...f, opponent_archetype: e.target.value }))}
          placeholder="e.g. Boros Energy"
          required
          className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-mtg-text text-sm focus:outline-none focus:border-mtg-gold/60 placeholder:text-mtg-muted"
        />
        <datalist id="archetypes">
          {allArchetypes.map(a => <option key={a} value={a} />)}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Result</label>
        <div className="flex gap-2">
          {RESULTS.map(r => (
            <label key={r} className="cursor-pointer">
              <input
                type="radio"
                name="result"
                value={r}
                checked={form.result === r}
                onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                className="sr-only"
              />
              <span className={`block px-3 py-1.5 rounded border text-sm font-medium transition-all
                ${form.result === r
                  ? r === '1-1-0' ? 'bg-amber-500/20 border-amber-400 text-amber-400' : r.startsWith('2') ? 'bg-mtg-success/20 border-mtg-success text-mtg-success' : 'bg-mtg-danger/20 border-mtg-danger text-mtg-danger'
                  : 'bg-mtg-bg border-mtg-border text-mtg-muted hover:border-mtg-gold/40'
                }`}
              >
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Date</label>
        <input
          type="date"
          value={form.played_at}
          onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
          className="bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-mtg-text text-sm focus:outline-none focus:border-mtg-gold/60"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Key plays, sideboard notes…"
          className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-mtg-text text-sm focus:outline-none focus:border-mtg-gold/60 placeholder:text-mtg-muted resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving || !form.opponent_archetype || !form.result}
        className="w-full bg-mtg-gold text-mtg-bg font-semibold py-2.5 rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {saving ? 'Saving…' : 'Log Match'}
      </button>
    </form>
  )
}
