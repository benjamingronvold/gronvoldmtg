import { useState, useRef } from 'react'
import { useMatches } from '../../hooks/useMatches.js'

const NORSK_MÅNEDER = {
  januar: '01', februar: '02', mars: '03', april: '04',
  mai: '05', juni: '06', juli: '07', august: '08',
  september: '09', oktober: '10', november: '11', desember: '12',
}

function månedTilDato(måned) {
  const key = (måned ?? '').toLowerCase().trim()
  const mm = NORSK_MÅNEDER[key]
  if (!mm) return new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear()
  return `${year}-${mm}-01`
}

function parseSpillResultat(verdi) {
  const v = (verdi ?? '').trim().toLowerCase()
  if (v === 'w' || v === 'win' || v === 'seier' || v === '1') return 'W'
  if (v === 'l' || v === 'loss' || v === 'tap' || v === '0') return 'L'
  return null
}

function spillTilMatchresultat(spill) {
  const gyldige = spill.filter(s => s !== null)
  const wins = gyldige.filter(s => s === 'W').length
  const losses = gyldige.filter(s => s === 'L').length
  if (wins === 2 && losses === 0) return '2-0'
  if (wins === 2 && losses === 1) return '2-1'
  if (wins === 2 && losses === 2) return '2-1' // 4-game format: 2 wins counts as match win
  if (wins === 1 && losses === 2) return '1-2'
  if (wins === 1 && losses >= 2) return '1-2'
  if (wins === 0 && losses >= 2) return '0-2'
  if (wins > losses) return '2-1'
  return '1-2'
}

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['CSV-filen er tom eller mangler data'] }

  const rows = []
  const errors = []

  // Skip header line, parse data rows
  lines.slice(1).forEach((line, i) => {
    // Handle both comma and tab separated
    const cols = line.includes('\t')
      ? line.split('\t').map(c => c.trim())
      : line.split(',').map(c => c.trim())

    const [måned, deck, pre1, pre2, post1, post2] = cols

    if (!deck || deck === '') {
      errors.push(`Linje ${i + 2}: mangler deck-navn`)
      return
    }

    const spill = [
      parseSpillResultat(pre1),
      parseSpillResultat(pre2),
      parseSpillResultat(post1),
      parseSpillResultat(post2),
    ].filter(s => s !== null)

    if (spill.length < 2) {
      errors.push(`Linje ${i + 2} (${deck}): for få gyldige spillresultater`)
      return
    }

    const result = spillTilMatchresultat(spill)
    const played_at = månedTilDato(måned)

    rows.push({
      opponent_archetype: deck.trim(),
      result,
      played_at,
      notes: null,
      _spill: { pre1, pre2, post1, post2 },
    })
  })

  return { rows, errors }
}

const resultFarge = {
  '2-0': 'text-green-400',
  '2-1': 'text-green-400',
  '1-2': 'text-red-400',
  '0-2': 'text-red-400',
}

function SpillBrikke({ verdi }) {
  const parsed = parseSpillResultat(verdi)
  if (!parsed) return <span className="text-mtg-muted/40">—</span>
  return (
    <span className={parsed === 'W' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
      {parsed}
    </span>
  )
}

export default function CsvImport({ onDone }) {
  const { addMatch } = useMatches()
  const [parsed, setParsed] = useState(null)
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { rows, errors } = parseCSV(ev.target.result)
      setParsed(rows)
      setErrors(errors)
      setImported(0)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!parsed?.length) return
    setImporting(true)
    let count = 0
    const importErrors = []
    for (const { _spill, ...row } of parsed) {
      try {
        await addMatch(row)
        count++
        setImported(count)
      } catch (err) {
        importErrors.push(`Feil ved import av "${row.opponent_archetype}": ${err.message}`)
      }
    }
    if (importErrors.length) setErrors(prev => [...prev, ...importErrors])
    setImporting(false)
    if (count > 0 && count === parsed.length) {
      setTimeout(onDone, 1200)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-mtg-text mb-1">Importer kamper fra CSV</h2>
        <p className="text-sm text-mtg-muted">Last opp en CSV- eller TSV-fil med kamphistorikk. Kolonner: <span className="font-mono text-mtg-text">Måned · Deck · Preboard · Preboard · Postboard1 · Postboard2</span></p>
      </div>

      <div className="bg-mtg-card border border-mtg-border rounded-lg p-4 space-y-2">
        <p className="text-xs font-mono text-mtg-muted">Forventet format (komma- eller tabulatorseparert):</p>
        <pre className="text-xs text-mtg-text font-mono bg-mtg-bg rounded p-3 overflow-x-auto">
{`Måned,Deck,Preboard,Preboard,Postboard1,Postboard2
Januar,Amulet Titan,W,L,W,
Februar,Burn,W,W,,
Mars,Izzet Rhinos,L,L,,`}
        </pre>
        <p className="text-xs text-mtg-muted">Spillresultater: <strong>W</strong> = seier · <strong>L</strong> = tap. Tomme felt ignoreres.</p>
      </div>

      <label className="block">
        <span className="text-sm text-mtg-muted block mb-2">Velg fil (.csv eller .tsv)</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          onChange={handleFile}
          className="block text-sm text-mtg-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-mtg-border file:bg-mtg-card file:text-mtg-text file:text-xs hover:file:bg-mtg-border/30 file:cursor-pointer"
        />
      </label>

      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 space-y-1">
          {errors.map((e, i) => <p key={i} className="text-red-400 text-xs">• {e}</p>)}
        </div>
      )}

      {parsed !== null && parsed.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-mtg-muted">{parsed.length} kamper funnet — forhåndsvisning:</p>
          <div className="bg-mtg-card border border-mtg-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-mtg-border sticky top-0 bg-mtg-card">
                <tr>
                  {['Dato', 'Motstander', 'Pre 1', 'Pre 2', 'Post 1', 'Post 2', 'Match'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-mtg-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((row, i) => (
                  <tr key={i} className="border-b border-mtg-border/40">
                    <td className="px-3 py-2 text-mtg-muted">{row.played_at}</td>
                    <td className="px-3 py-2 text-mtg-text">{row.opponent_archetype}</td>
                    <td className="px-3 py-2"><SpillBrikke verdi={row._spill.pre1} /></td>
                    <td className="px-3 py-2"><SpillBrikke verdi={row._spill.pre2} /></td>
                    <td className="px-3 py-2"><SpillBrikke verdi={row._spill.post1} /></td>
                    <td className="px-3 py-2"><SpillBrikke verdi={row._spill.post2} /></td>
                    <td className={`px-3 py-2 font-semibold ${resultFarge[row.result]}`}>{row.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importing ? (
            <p className="text-sm text-mtg-muted animate-pulse">Importerer {imported}/{parsed.length}…</p>
          ) : imported > 0 && imported === parsed.length ? (
            <p className="text-sm text-green-400">{imported} kamper importert!</p>
          ) : (
            <button
              onClick={handleImport}
              className="bg-mtg-gold text-mtg-bg text-sm font-semibold px-4 py-2 rounded hover:brightness-110 transition-all"
            >
              Importer {parsed.length} kamper
            </button>
          )}
        </div>
      )}

      {parsed !== null && parsed.length === 0 && errors.length === 0 && (
        <p className="text-sm text-mtg-muted">Ingen gyldige rader funnet i filen.</p>
      )}
    </div>
  )
}
