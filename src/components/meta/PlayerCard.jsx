export default function PlayerCard({ player, onArchetypeChange }) {
  return (
    <div className="bg-mtg-card border border-mtg-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-mtg-text">{player.display_name}</p>
          {player.moxfield_username && (
            <p className="text-xs text-mtg-muted">Moxfield: {player.moxfield_username}</p>
          )}
          {player.mtgo_username && (
            <p className="text-xs text-mtg-muted">MTGO: {player.mtgo_username}</p>
          )}
        </div>
        {player.scraped_at && (
          <span className="text-xs text-mtg-success border border-mtg-success/30 rounded-full px-2 py-0.5 shrink-0">
            Fetched
          </span>
        )}
      </div>

      {onArchetypeChange ? (
        <input
          value={player.archetype ?? ''}
          onChange={e => onArchetypeChange(player.id, e.target.value)}
          placeholder="Archetype"
          className="bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />
      ) : (
        player.archetype && (
          <span className="text-sm text-mtg-gold font-medium">{player.archetype}</span>
        )
      )}

      {player.decklist_url && (
        <a
          href={player.decklist_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors"
        >
          View latest decklist →
        </a>
      )}
    </div>
  )
}
