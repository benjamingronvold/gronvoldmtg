import { useState } from 'react'
import { useMatches } from '../../hooks/useMatches.js'

const PAGE_SIZE = 20

export default function MatchHistory() {
  const { matches, deleteMatch } = useMatches()
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(null)

  const total = matches.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleDelete(id) {
    if (!confirm('Delete this match?')) return
    setDeleting(id)
    try { await deleteMatch(id) } finally { setDeleting(null) }
  }

  if (!matches.length) {
    return (
      <div className="text-center py-12 text-mtg-muted text-sm">
        No matches logged yet. Log your first match above!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-mtg-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Opponent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">Result</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider hidden sm:table-cell">Notes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.map(m => (
              <tr key={m.id} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30">
                <td className="px-4 py-3 text-mtg-muted whitespace-nowrap">{m.played_at}</td>
                <td className="px-4 py-3 text-mtg-text font-medium">{m.opponent_archetype}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${m.match_win ? 'text-mtg-success' : 'text-mtg-danger'}`}>
                    {m.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-mtg-muted text-xs hidden sm:table-cell max-w-xs truncate">
                  {m.notes}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deleting === m.id}
                    className="text-mtg-muted hover:text-mtg-danger text-xs transition-colors"
                  >
                    {deleting === m.id ? '…' : '✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-mtg-muted">
          <span>{total} matches total</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-mtg-border rounded hover:border-mtg-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-mtg-border rounded hover:border-mtg-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
