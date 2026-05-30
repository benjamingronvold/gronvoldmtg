import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pct(n, d) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}

export default function StatsPanel({ matches }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [sortBy, setSortBy] = useState('archetype')
  const [sortAsc, setSortAsc] = useState(true)

  const availableYears = useMemo(() => {
    const years = [...new Set(matches.map(m => m.played_at?.slice(0, 4)))].filter(Boolean).sort().reverse()
    return years.length ? years : [String(currentYear)]
  }, [matches, currentYear])

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (year && !m.played_at?.startsWith(year)) return false
      if (month && m.played_at?.slice(5, 7) !== String(month).padStart(2, '0')) return false
      return true
    })
  }, [matches, year, month])

  const stats = useMemo(() => {
    const map = {}
    for (const m of filtered) {
      const arch = m.opponent_archetype || 'Unknown'
      if (!map[arch]) map[arch] = { archetype: arch, matches: 0, matchWins: 0, matchDraws: 0, gameWins: 0, gameLosses: 0 }
      map[arch].matches++
      if (m.match_win) map[arch].matchWins++
      if (m.result === '1-1-0') map[arch].matchDraws++
      map[arch].gameWins += m.game_wins ?? 0
      map[arch].gameLosses += m.game_losses ?? 0
    }
    return Object.values(map).map(s => ({
      ...s,
      mwPct: pct(s.matchWins, s.matches),
      gwPct: pct(s.gameWins, s.gameWins + s.gameLosses),
    }))
  }, [filtered])

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      let va = a[sortBy === 'archetype' ? 'archetype' : sortBy === 'mw' ? 'mwPct' : sortBy === 'gw' ? 'gwPct' : 'matches']
      let vb = b[sortBy === 'archetype' ? 'archetype' : sortBy === 'mw' ? 'mwPct' : sortBy === 'gw' ? 'gwPct' : 'matches']
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortAsc ? va - vb : vb - va
    })
  }, [stats, sortBy, sortAsc])

  const totalMatches = filtered.length
  const totalWins = filtered.filter(m => m.match_win).length
  const totalDraws = filtered.filter(m => m.result === '1-1-0').length
  const totalLosses = totalMatches - totalWins - totalDraws
  const totalGameWins = filtered.reduce((s, m) => s + (m.game_wins ?? 0), 0)
  const totalGameLosses = filtered.reduce((s, m) => s + (m.game_losses ?? 0), 0)

  function toggleSort(col) {
    if (sortBy === col) setSortAsc(a => !a)
    else { setSortBy(col); setSortAsc(false) }
  }

  const SortHeader = ({ col, label }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider cursor-pointer hover:text-mtg-text select-none"
      onClick={() => toggleSort(col)}
    >
      {label} {sortBy === col ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="bg-mtg-card border border-mtg-border rounded-lg px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
        >
          <option value="">All Years</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-mtg-card border border-mtg-border rounded-lg px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Match Record', value: totalDraws > 0 ? `${totalWins}–${totalLosses}–${totalDraws}` : `${totalWins}–${totalLosses}` },
          { label: 'Match Win%', value: `${pct(totalWins, totalMatches)}%` },
          { label: 'Game Record', value: `${totalGameWins}–${totalGameLosses}` },
          { label: 'Game Win%', value: `${pct(totalGameWins, totalGameWins + totalGameLosses)}%` },
        ].map(s => (
          <div key={s.label} className="bg-mtg-card border border-mtg-border rounded-xl p-4 text-center">
            <p className="text-mtg-muted text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-display text-xl text-mtg-gold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {stats.length > 0 && (
        <div className="bg-mtg-card border border-mtg-border rounded-xl p-4">
          <h3 className="font-display text-sm text-mtg-muted mb-4 uppercase tracking-wider">Match Win% by Archetype</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted} margin={{ top: 0, right: 10, left: -20, bottom: 60 }}>
              <XAxis
                dataKey="archetype"
                tick={{ fill: '#8888a8', fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#8888a8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8, color: '#e8e8f0' }}
                formatter={(v) => [`${v}%`, 'MW%']}
              />
              <ReferenceLine y={50} stroke="#2d2d44" strokeDasharray="4 2" />
              <Bar dataKey="mwPct" radius={[3, 3, 0, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.archetype} fill={entry.mwPct >= 50 ? '#3cb371' : '#c0392b'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {sorted.length > 0 ? (
        <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-mtg-border">
              <tr>
                <SortHeader col="archetype" label="Archetype" />
                <SortHeader col="matches" label="Matches" />
                <SortHeader col="mw" label="MW%" />
                <SortHeader col="gw" label="GW%" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.archetype} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30">
                  <td className="px-4 py-3 text-mtg-text font-medium">{s.archetype}</td>
                  <td className="px-4 py-3 text-mtg-muted">
                    {s.matchWins}–{s.matches - s.matchWins - s.matchDraws}{s.matchDraws > 0 ? `–${s.matchDraws}` : ''}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${s.mwPct >= 50 ? 'text-mtg-success' : 'text-mtg-danger'}`}>
                    {s.mwPct}%
                  </td>
                  <td className={`px-4 py-3 ${s.gwPct >= 50 ? 'text-mtg-success' : 'text-mtg-danger'}`}>
                    {s.gwPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-mtg-muted">
          No matches found for the selected period.
        </div>
      )}
    </div>
  )
}
