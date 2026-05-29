const MANA_STYLES = {
  W: 'bg-gray-100 text-gray-900 border border-gray-300',
  U: 'bg-blue-500 text-white',
  B: 'bg-gray-800 text-white border border-gray-600',
  R: 'bg-red-500 text-white',
  G: 'bg-green-500 text-white',
  colorless: 'bg-gray-500 text-white',
}

const MANA_SYMBOLS = { W: 'W', U: 'U', B: 'B', R: 'R', G: 'G' }

export default function ManaDisplay({ manaPool }) {
  if (!manaPool) return null

  const pips = []
  for (const [color, count] of Object.entries(manaPool)) {
    if (!count || count <= 0) continue
    if (color === 'colorless') {
      pips.push(
        <span key="colorless" className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${MANA_STYLES.colorless}`}>
          {count}
        </span>
      )
    } else {
      for (let i = 0; i < count; i++) {
        pips.push(
          <span key={`${color}-${i}`} className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${MANA_STYLES[color]}`}>
            {MANA_SYMBOLS[color]}
          </span>
        )
      }
    }
  }

  if (pips.length === 0) {
    return <span className="text-gray-500 text-sm">No floating mana</span>
  }

  return <div className="flex flex-wrap gap-1">{pips}</div>
}
