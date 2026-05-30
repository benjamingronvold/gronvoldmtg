import { useState, useMemo } from 'react'
import { useMatches } from '../../hooks/useMatches.js'

const KNOWN_ARCHETYPES = [
  'Affinity', 'Amulet Titan', 'Azorius Control', 'Bant Ritual', 'Blue Belcher',
  'Boros Energy', 'Broodscale Combo', 'Burn', 'Creativity', 'Death & Taxes',
  'Dimir Control', 'Dredge', 'Eldrazi Ramp', 'Eldrazi Tron', 'Esper Blink',
  'Esper Goryo', 'Frogtide', 'Golgari Rock', 'Green Tron', 'Grinding Breach',
  'Grixis Death\'s Shadow', 'Grixis Reanimator', 'Gruul Midrange', 'Hammer',
  'Infect', 'Jeskai Blink', 'Jeskai Control', 'Jeskai Energy', 'Jund',
  'Living End', 'Merfolk', 'Mill', 'Murktide', 'Neoform', 'Omnath',
  'Orzhov Blink', 'Ponza', 'Prowess', 'Rakdos Scam', 'Ruby Storm',
  'Samwise Combo', 'Scales', 'Simic Ritual', 'Temur Rhinos', 'The Rack',
  'Twin', 'Yawgmoth', 'Zoo',
]

const MÅNEDER = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des',
]

const MM_MAP = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',Mai:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Okt:'10',Nov:'11',Des:'12' }

function lagDato(måned, år) {
  const mm = MM_MAP[måned] ?? '01'
  return `${år}-${mm}-01`
}

let nextId = 1
function newRow() {
  const now = new Date()
  return {
    id: nextId++,
    archetype: '',
    wins: 0,
    losses: 0,
    draws: 0,
    måned: MÅNEDER[now.getMonth()],
    år: String(now.getFullYear()),
  }
}

export default function BulkEntry({ addMatch, onDone }) {
  const { matches } = useMatches()
  const [rows, setRows] = useState([newRow()])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null)
  const [errors, setErrors] = useState([])

  const allArchetypes = useMemo(() => {
    const fromHistory = matches.map(m => m.opponent_archetype).filter(Boolean)
    return [...new Set([...KNOWN_ARCHETYPES, ...fromHistory])].sort()
  }, [matches])

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => String(current - i))
  }, [])

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function addRow() {
    setRows(prev => [...prev, newRow()])
  }

  const totalKamper = rows.reduce((s, r) => s + Number(r.wins) + Number(r.losses) + Number(r.draws), 0)

  async function handleSubmit() {
    const filledRows = rows.filter(r => r.archetype.trim() && (Number(r.wins) + Number(r.losses) + Number(r.draws)) > 0)
    if (!filledRows.length) return

    setSaving(true)
    setErrors([])
    let count = 0
    const total = filledRows.reduce((s, r) => s + Number(r.wins) + Number(r.losses) + Number(r.draws), 0)
    const errs = []

    for (const row of filledRows) {
      const played_at = lagDato(row.måned, row.år)
      const archetype = row.archetype.trim()

      const insertMany = async (result, n) => {
        for (let i = 0; i < n; i++) {
          try {
            await addMatch({ opponent_archetype: archetype, result, played_at, notes: null })
            count++
            setProgress({ count, total })
          } catch (err) {
            errs.push(`${archetype} (${result}): ${err.message}`)
          }
        }
      }

      await insertMany('2-0', Number(row.wins))
      await insertMany('0-2', Number(row.losses))
      await insertMany('1-1-0', Number(row.draws))
    }

    setErrors(errs)
    setSaving(false)
    if (errs.length === 0) {
      setTimeout(onDone, 1200)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-mtg-text mb-1">Legg inn per archetype</h2>
        <p className="text-sm text-mtg-muted">Fyll inn antall seier, tap og uavgjort per motstander-archetype. Hver rad oppretter individuelle kampregistreringer.</p>
      </div>

      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-[1fr,80px,80px,80px,100px,80px,32px] gap-2 px-1">
          {['Archetype', 'Seier', 'Tap', 'Uavgjort', 'Måned', 'År', ''].map(h => (
            <span key={h} className="text-xs font-medium text-mtg-muted uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {rows.map(row => (
          <div key={row.id} className="grid grid-cols-[1fr,80px,80px,80px,100px,80px,32px] gap-2 items-center">
            <div className="relative">
              <input
                list={`arch-${row.id}`}
                value={row.archetype}
                onChange={e => updateRow(row.id, 'archetype', e.target.value)}
                placeholder="Archetype…"
                className="w-full bg-mtg-card border border-mtg-border rounded px-3 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60 placeholder:text-mtg-muted"
              />
              <datalist id={`arch-${row.id}`}>
                {allArchetypes.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>
            <input
              type="number" min={0}
              value={row.wins}
              onChange={e => updateRow(row.id, 'wins', e.target.value)}
              className="bg-mtg-card border border-mtg-border rounded px-2 py-1.5 text-sm text-green-400 text-center focus:outline-none focus:border-mtg-gold/60"
            />
            <input
              type="number" min={0}
              value={row.losses}
              onChange={e => updateRow(row.id, 'losses', e.target.value)}
              className="bg-mtg-card border border-mtg-border rounded px-2 py-1.5 text-sm text-red-400 text-center focus:outline-none focus:border-mtg-gold/60"
            />
            <input
              type="number" min={0}
              value={row.draws}
              onChange={e => updateRow(row.id, 'draws', e.target.value)}
              className="bg-mtg-card border border-mtg-border rounded px-2 py-1.5 text-sm text-amber-400 text-center focus:outline-none focus:border-mtg-gold/60"
            />
            <select
              value={row.måned}
              onChange={e => updateRow(row.id, 'måned', e.target.value)}
              className="bg-mtg-card border border-mtg-border rounded px-2 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
            >
              {MÅNEDER.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={row.år}
              onChange={e => updateRow(row.id, 'år', e.target.value)}
              className="bg-mtg-card border border-mtg-border rounded px-2 py-1.5 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="text-mtg-muted hover:text-red-400 transition-colors disabled:opacity-30 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="text-sm text-mtg-muted hover:text-mtg-text border border-dashed border-mtg-border rounded px-4 py-2 transition-colors w-full"
      >
        + Legg til archetype
      </button>

      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 space-y-1">
          {errors.map((e, i) => <p key={i} className="text-red-400 text-xs">• {e}</p>)}
        </div>
      )}

      <div className="flex items-center gap-4">
        {saving ? (
          <div className="space-y-1 flex-1">
            <p className="text-sm text-mtg-muted animate-pulse">Lagrer… {progress?.count}/{progress?.total}</p>
            <div className="h-1.5 bg-mtg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-mtg-gold transition-all duration-200"
                style={{ width: `${((progress?.count ?? 0) / (progress?.total ?? 1)) * 100}%` }}
              />
            </div>
          </div>
        ) : progress?.count > 0 && progress.count === progress.total && errors.length === 0 ? (
          <p className="text-sm text-green-400 font-medium">{progress.count} kamper lagret!</p>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={totalKamper === 0}
            className="bg-mtg-gold text-mtg-bg font-semibold px-6 py-2.5 rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            Lagre {totalKamper > 0 ? `${totalKamper} kamper` : 'kamper'}
          </button>
        )}
      </div>
    </div>
  )
}
