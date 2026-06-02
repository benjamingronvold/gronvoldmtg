import { useState } from 'react'

const PAGE_SIZE = 20

export default function MatchHistory({ matches, allMatches, deleteMatch, deleteMatches }) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState(false)

  const total = matches.length
  const totalAll = allMatches?.length ?? total
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allOnPageSelected = paginated.length > 0 && paginated.every(m => selected.has(m.id))
  const allSelected = selected.size === total

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function togglePage() {
    if (allOnPageSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        paginated.forEach(m => next.delete(m.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        paginated.forEach(m => next.add(m.id))
        return next
      })
    }
  }

  function selectAll() { setSelected(new Set(matches.map(m => m.id))) }
  function clearSelection() { setSelected(new Set()); setConfirmBulk(false) }

  async function handleDeleteSelected() {
    setDeleting(true)
    try {
      await deleteMatches([...selected])
      setSelected(new Set())
      setConfirmBulk(false)
      setPage(1)
    } finally {
      setDeleting(false)
    }
  }

  if (!matches.length) {
    return (
      <div className="text-center py-12 text-mtg-muted text-sm">
        Ingen kamper for valgt filter.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-mtg-card border border-mtg-border rounded-lg px-4 py-2.5">
          <span className="text-sm text-mtg-text font-medium">{selected.size} valgt</span>
          {!allSelected && (
            <button onClick={selectAll} className="text-xs text-mtg-muted hover:text-mtg-text underline">
              Velg alle {total}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {confirmBulk ? (
              <>
                <span className="text-xs text-red-400">Slette {selected.size} kamper?</span>
                <button onClick={handleDeleteSelected} disabled={deleting}
                  className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30 disabled:opacity-50">
                  {deleting ? '…' : 'Ja, slett'}
                </button>
                <button onClick={() => setConfirmBulk(false)} className="text-xs text-mtg-muted hover:text-mtg-text">Avbryt</button>
              </>
            ) : (
              <>
                <button onClick={() => setConfirmBulk(true)}
                  className="text-xs px-3 py-1.5 text-red-400 border border-red-500/40 rounded hover:bg-red-500/10 transition-colors">
                  Slett valgte
                </button>
                <button onClick={clearSelection} className="text-xs text-mtg-muted hover:text-mtg-text">Avbryt valg</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-mtg-border">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={allOnPageSelected} onChange={togglePage}
                  className="rounded accent-mtg-gold cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Dato</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Mitt dekk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Motstander</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Resultat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider hidden sm:table-cell">Notater</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {paginated.map(m => (
              <tr key={m.id}
                className={`border-b border-mtg-border/50 cursor-pointer transition-colors
                  ${selected.has(m.id) ? 'bg-mtg-gold/5' : 'hover:bg-mtg-bg/30'}`}
                onClick={() => toggleOne(m.id)}
              >
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleOne(m.id)}
                    className="rounded accent-mtg-gold cursor-pointer" />
                </td>
                <td className="px-4 py-3 text-mtg-muted whitespace-nowrap">{m.played_at}</td>
                <td className="px-4 py-3 text-mtg-gold text-xs font-medium">{m.my_deck || '—'}</td>
                <td className="px-4 py-3 text-mtg-text font-medium">{m.opponent_archetype}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${m.match_win ? 'text-mtg-success' : m.result === '1-1-0' ? 'text-amber-400' : 'text-mtg-danger'}`}>
                    {m.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-mtg-muted text-xs hidden sm:table-cell max-w-xs truncate">{m.notes}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={async () => {
                      setDeleting(true)
                      try { await deleteMatch(m.id) } finally { setDeleting(false) }
                    }}
                    className="text-mtg-muted hover:text-mtg-danger text-xs transition-colors"
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-mtg-muted">
          <span>{total}{total < totalAll ? ` av ${totalAll}` : ''} kamper</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border border-mtg-border rounded hover:border-mtg-gold/40 disabled:opacity-40 transition-colors">← Forrige</button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 border border-mtg-border rounded hover:border-mtg-gold/40 disabled:opacity-40 transition-colors">Neste →</button>
          </div>
        </div>
      )}
    </div>
  )
}
