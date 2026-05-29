import CardImage from './CardImage.jsx'
import ManaDisplay from './ManaDisplay.jsx'

export default function BoardState({ boardstate, opponent }) {
  const { battlefield, hand, graveyard, floating, life } = boardstate

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Opponent warning */}
      {opponent?.enabled && (
        <div className="bg-amber-900 border-b border-amber-700 px-4 py-2 flex items-center gap-2">
          <span className="text-amber-400 font-semibold text-sm">⚠ Opponent:</span>
          <span className="text-amber-200 text-sm">{opponent.note}</span>
          {opponent.deck && <span className="text-amber-400 text-xs ml-auto">Playing: {opponent.deck}</span>}
        </div>
      )}

      {/* Battlefield */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Battlefield</p>
        {battlefield.length === 0 ? (
          <p className="text-gray-600 text-sm italic">Empty</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {battlefield.map((card, i) => (
              <CardImage key={`bf-${i}`} cardName={card.name} count={card.count} tapped={card.tapped} />
            ))}
          </div>
        )}
      </div>

      {/* Middle bar */}
      <div className="border-t border-gray-700 grid grid-cols-2 divide-x divide-gray-700">
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Graveyard</p>
          {graveyard.length === 0 ? (
            <p className="text-gray-600 text-sm italic">Empty</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {graveyard.map((card, i) => (
                <CardImage key={`gy-${i}`} cardName={card.name} count={card.count} size="small" />
              ))}
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Floating Mana · Life: {life ?? 20}
          </p>
          <ManaDisplay manaPool={floating} />
        </div>
      </div>

      {/* Hand */}
      <div className="border-t border-gray-700 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hand</p>
        {hand.length === 0 ? (
          <p className="text-gray-600 text-sm italic">Empty</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {hand.map((card, i) => (
              <CardImage key={`h-${i}`} cardName={card.name} count={card.count} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
