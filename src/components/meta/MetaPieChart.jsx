import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = [
  '#c89b3c', '#3cb371', '#5865F2', '#e74c3c', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db', '#e91e63', '#00bcd4',
]

function buildChartData(players) {
  const map = {}
  for (const p of players) {
    const arch = p.archetype || 'Unknown'
    if (!map[arch]) map[arch] = { name: arch, count: 0, players: [] }
    map[arch].count++
    map[arch].players.push(p.display_name)
  }
  return Object.values(map).sort((a, b) => b.count - a.count)
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-mtg-card border border-mtg-border rounded-lg p-3 text-sm shadow-xl max-w-xs">
      <p className="font-display text-mtg-gold font-semibold mb-1">{d.name}</p>
      <p className="text-mtg-muted mb-1">{d.count} player{d.count !== 1 ? 's' : ''}</p>
      <p className="text-xs text-mtg-muted">{d.players.join(', ')}</p>
    </div>
  )
}

export default function MetaPieChart({ players }) {
  const data = buildChartData(players.filter(p => p.archetype))
  const chartRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(null)

  if (data.length === 0) {
    return (
      <div className="bg-mtg-card border border-mtg-border rounded-xl p-8 text-center text-mtg-muted">
        No archetype data yet. Fetch decklists or assign archetypes to players.
      </div>
    )
  }

  async function downloadPNG() {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#0f0f1a',
      scale: 2,
    })
    const a = document.createElement('a')
    a.download = 'meta-chart.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="bg-mtg-card border border-mtg-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-mtg-gold">Meta Distribution</h3>
        <button
          onClick={downloadPNG}
          className="text-xs text-mtg-muted hover:text-mtg-gold border border-mtg-border rounded px-2.5 py-1 transition-colors"
        >
          Export PNG
        </button>
      </div>

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[i % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.6}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => {
                const total = data.reduce((s, d) => s + d.count, 0)
                const pct = total > 0 ? Math.round((entry.payload.count / total) * 100) : 0
                return (
                  <span style={{ color: '#e8e8f0', fontSize: 12 }}>
                    {value}{' '}
                    <span style={{ color: '#a0a0b8', fontSize: 11 }}>({pct}%)</span>
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
