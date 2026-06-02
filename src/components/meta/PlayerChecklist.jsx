import { useState, useMemo } from 'react'

export default function PlayerChecklist({ players, onAddSelected, loading }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return players.filter(p =>
      p.display_name.toLowerCase().includes(q) ||
      (p.archetype ?? '').toLowerCase().includes(q) ||
      (p.moxfield_username ?? '').toLowerCase().includes(q)
    )
  }, [players, search])

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  async function handleAdd() {
    const toAdd = players.filter(p => selected.has(p.id))
    await onAddSelected(toAdd)
    setSelected(new Set())
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søk i spillerdatabase…"
          className="flex-1 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />
        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-xs text-mtg-muted hover:text-mtg-gold border border-mtg-border rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
          >
            {selected.size === filtered.length ? 'Fjern alle' : 'Velg alle'}
          </button>
        )}
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-mtg-muted py-2">Ingen spillere i databasen ennå.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-mtg-muted py-2">Ingen treff på «{search}».</p>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {filtered.map(p => (
            <label
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none
                ${selected.has(p.id)
                  ? 'border-mtg-gold/50 bg-mtg-gold/5'
                  : 'border-mtg-border hover:border-mtg-border/80'
                }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-mtg-gold shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-mtg-text font-medium truncate">{p.display_name}</p>
                <p className="text-xs text-mtg-muted truncate">
                  {[p.archetype, p.moxfield_username].filter(Boolean).join(' · ') || 'Ingen info'}
                </p>
              </div>
              {p.decklist_url && (
                <a
                  href={p.decklist_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors shrink-0"
                >
                  Deck →
                </a>
              )}
            </label>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full bg-mtg-gold text-mtg-bg font-semibold text-sm py-2 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all"
        >
          {loading ? 'Legger til…' : `Legg til ${selected.size} spiller${selected.size !== 1 ? 'e' : ''}`}
        </button>
      )}
    </div>
  )
}
