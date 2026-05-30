import { useState, useRef } from 'react'
import { useMatches } from '../../hooks/useMatches.js'

const MÅNED_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  mai: '05', may: '05', jun: '06', jul: '07',
  aug: '08', sep: '09', okt: '10', oct: '10',
  nov: '11', des: '12', dec: '12',
}

function månedTilDato(måned) {
  // Format: "Apr 2026", "Jan 2024", "Des 2023" etc.
  const parts = (måned ?? '').trim().split(/\s+/)
  if (parts.length === 2) {
    const mm = MÅNED_MAP[parts[0].toLowerCase().slice(0, 3)]
    const yyyy = parts[1]
    if (mm && /^\d{4}$/.test(yyyy)) return `${yyyy}-${mm}-01`
  }
  return new Date().toISOString().slice(0, 10)
}

function parseSpill(verdi) {
  const v = (verdi ?? '').trim().toLowerCase()
  if (v === 'w' || v === 'win' || v === 'seier' || v === '1') return 'W'
  if (v === 'l' || v === 'loss' || v === 'tap' || v === '0') return 'L'
  return null
}

function beregnResultat(g1, g2, g3) {
  const p1 = parseSpill(g1)
  const p2 = parseSpill(g2)

  if (!p1) return { result: null, feil: `Mangler G1-resultat` }
  if (!p2) return { result: null, feil: `Mangler G2-resultat (Postboard1)` }

  if (p1 === 'W' && p2 === 'W') return { result: '2-0', feil: null }
  if (p1 === 'L' && p2 === 'L') return { result: '0-2', feil: null }

  // Split — trenger G3
  const p3 = parseSpill(g3)
  if (p3 === 'W') return { result: '2-1', feil: null }
  if (p3 === 'L') return { result: '1-2', feil: null }
  return { result: null, feil: 'Split (G1≠G2) — mangler Postboard2' }
}

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [] }

  const rows = []

  lines.slice(1).forEach((line, i) => {
    const cols = line.split(';').map(c => c.trim())
    if (cols.every(c => !c)) return

    const [måned, deck, g1, g2, g3] = cols
    if (!deck) return

    const played_at = månedTilDato(måned)
    const { result, feil } = beregnResultat(g1, g2, g3)

    rows.push({ id: i, opponent_archetype: deck.trim(), played_at, result, feil, _raw: { g1, g2, g3 } })
  })

  return { rows }
}

const resultFarge = {
  '2-0': 'text-green-400', '2-1': 'text-green-400',
  '1-2': 'text-red-400', '0-2': 'text-red-400',
}

function SpillBrikke({ verdi }) {
  const p = parseSpill(verdi)
  if (!p) return <span className="text-mtg-muted/40 text-xs">—</span>
  return <span className={p === 'W' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{p}</span>
}

export default function CsvImport({ onDone }) {
  const { addMatch } = useMatches()
  const [rows, setRows] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [importErrors, setImportErrors] = useState([])
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { rows } = parseCSV(ev.target.result)
      setRows(rows)
      setImported(0)
      setImportErrors([])
    }
    reader.readAsText(file, 'UTF-8')
  }

  function setManueltResultat(id, result) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, result, feil: null } : r))
  }

  const feilRader = rows?.filter(r => r.feil) ?? []
  const gyldige = rows?.filter(r => r.result) ?? []

  async function handleImport() {
    if (!gyldige.length) return
    setImporting(true)
    let count = 0
    const errs = []
    for (const { id, feil, _raw, ...row } of gyldige) {
      try {
        await addMatch({ ...row, notes: null })
        count++
        setImported(count)
      } catch (err) {
        errs.push(`Feil ved import av "${row.opponent_archetype}": ${err.message}`)
      }
    }
    setImportErrors(errs)
    setImporting(false)
    if (count > 0 && count === gyldige.length && errs.length === 0) {
      setTimeout(onDone, 1200)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-mtg-text mb-1">Importer kamper fra CSV</h2>
        <p className="text-sm text-mtg-muted">
          Format: <span className="font-mono text-mtg-text">Måned;Deck;Preboard;Postboard1;Postboard2</span> (semikolonseparert)
        </p>
      </div>

      <div className="bg-mtg-card border border-mtg-border rounded-lg p-4 space-y-2">
        <pre className="text-xs text-mtg-text font-mono bg-mtg-bg rounded p-3 overflow-x-auto">{`Måned;Deck;Preboard;Postboard1;Postboard2
Apr 2026;Amulet Titan;W;W;
Apr 2026;Boros;L;W;W
Mar 2026;Jeskai Blink;W;L;`}</pre>
        <p className="text-xs text-mtg-muted">WW=2-0 · LL=0-2 · Split krever Postboard2 for avgjørelse</p>
      </div>

      <label className="block">
        <span className="text-sm text-mtg-muted block mb-2">Velg CSV-fil</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv"
          onChange={handleFile}
          className="block text-sm text-mtg-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-mtg-border file:bg-mtg-card file:text-mtg-text file:text-xs hover:file:bg-mtg-border/30 file:cursor-pointer"
        />
      </label>

      {rows !== null && (
        <div className="space-y-4">

          {feilRader.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-400">
                {feilRader.length} rad{feilRader.length > 1 ? 'er' : ''} krever manuell retting:
              </p>
              <div className="bg-amber-900/10 border border-amber-500/30 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-amber-500/20">
                    <tr>
                      {['Dato', 'Motstander', 'G1', 'G2', 'G3', 'Feil', 'Sett resultat'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-mtg-muted font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feilRader.map(row => (
                      <tr key={row.id} className="border-b border-amber-500/10">
                        <td className="px-3 py-2 text-mtg-muted">{row.played_at}</td>
                        <td className="px-3 py-2 text-mtg-text">{row.opponent_archetype}</td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g1} /></td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g2} /></td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g3} /></td>
                        <td className="px-3 py-2 text-amber-400">{row.feil}</td>
                        <td className="px-3 py-2">
                          <select
                            value={row.result ?? ''}
                            onChange={e => e.target.value && setManueltResultat(row.id, e.target.value)}
                            className="bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-mtg-text text-xs focus:outline-none focus:border-mtg-gold/60"
                          >
                            <option value="">— velg —</option>
                            <option value="2-0">2-0</option>
                            <option value="2-1">2-1</option>
                            <option value="1-2">1-2</option>
                            <option value="0-2">0-2</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {gyldige.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-mtg-muted">{gyldige.length} gyldige kamper:</p>
              <div className="bg-mtg-card border border-mtg-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-mtg-border sticky top-0 bg-mtg-card">
                    <tr>
                      {['Dato', 'Motstander', 'G1', 'G2', 'G3', 'Resultat'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-mtg-muted font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gyldige.map(row => (
                      <tr key={row.id} className="border-b border-mtg-border/40">
                        <td className="px-3 py-2 text-mtg-muted">{row.played_at}</td>
                        <td className="px-3 py-2 text-mtg-text">{row.opponent_archetype}</td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g1} /></td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g2} /></td>
                        <td className="px-3 py-2"><SpillBrikke verdi={row._raw.g3} /></td>
                        <td className={`px-3 py-2 font-semibold ${resultFarge[row.result]}`}>{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 space-y-1">
              {importErrors.map((e, i) => <p key={i} className="text-red-400 text-xs">• {e}</p>)}
            </div>
          )}

          {importing ? (
            <p className="text-sm text-mtg-muted animate-pulse">Importerer {imported}/{gyldige.length}…</p>
          ) : imported > 0 && imported === gyldige.length && importErrors.length === 0 ? (
            <p className="text-sm text-green-400">{imported} kamper importert!</p>
          ) : gyldige.length > 0 ? (
            <button
              onClick={handleImport}
              className="bg-mtg-gold text-mtg-bg text-sm font-semibold px-4 py-2 rounded hover:brightness-110 transition-all"
            >
              Importer {gyldige.length} kamper
              {feilRader.length > 0 && <span className="ml-1 opacity-70">({feilRader.length} utelatt)</span>}
            </button>
          ) : (
            <p className="text-sm text-mtg-muted">Fiks radene over for å importere.</p>
          )}
        </div>
      )}
    </div>
  )
}
