import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import PlayerCard from './PlayerCard.jsx'

export default function DecklistFetcher({ players, tournamentId, onPlayersUpdated }) {
  const [statuses, setStatuses] = useState({})
  const [localPlayers, setLocalPlayers] = useState(players)

  const fetchablePlayers = localPlayers.filter(p => p.moxfield_username)

  function setStatus(id, status) {
    setStatuses(s => ({ ...s, [id]: status }))
  }

  async function fetchOne(player) {
    setStatus(player.id, 'loading')
    try {
      const res = await fetch('/api/scrape-decklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moxfieldUsername: player.moxfield_username }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scrape failed')

      const updates = {
        archetype: data.archetype ?? '',
        decklist_url: data.decklistUrl ?? '',
        scraped_at: new Date().toISOString(),
      }

      await supabase
        .from('tournament_players')
        .update(updates)
        .eq('id', player.id)

      setLocalPlayers(prev =>
        prev.map(p => p.id === player.id ? { ...p, ...updates } : p)
      )
      setStatus(player.id, 'done')
      onPlayersUpdated?.()
    } catch (err) {
      setStatus(player.id, `error:${err.message}`)
    }
  }

  async function fetchAll() {
    for (const p of fetchablePlayers) {
      await fetchOne(p)
    }
  }

  async function updateArchetype(playerId, archetype) {
    setLocalPlayers(prev =>
      prev.map(p => p.id === playerId ? { ...p, archetype } : p)
    )
    await supabase
      .from('tournament_players')
      .update({ archetype })
      .eq('id', playerId)
    onPlayersUpdated?.()
  }

  if (fetchablePlayers.length === 0) {
    return (
      <p className="text-mtg-muted text-sm py-4">
        No players with Moxfield usernames. Add Moxfield usernames when adding players.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mtg-muted">
          {fetchablePlayers.length} player{fetchablePlayers.length !== 1 ? 's' : ''} with Moxfield usernames
        </p>
        <button
          onClick={fetchAll}
          className="bg-mtg-gold/20 border border-mtg-gold/40 text-mtg-gold text-sm px-3 py-1.5 rounded-lg hover:bg-mtg-gold/30 transition-colors"
        >
          Fetch All
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {localPlayers.map(player => (
          <div key={player.id} className="relative">
            {statuses[player.id] === 'loading' && (
              <div className="absolute inset-0 bg-mtg-bg/60 rounded-xl flex items-center justify-center z-10">
                <span className="text-mtg-gold text-xs animate-pulse">Fetching…</span>
              </div>
            )}
            {statuses[player.id]?.startsWith('error:') && (
              <p className="text-xs text-red-400 mb-1 px-1">
                {statuses[player.id].replace('error:', '')}
              </p>
            )}
            <PlayerCard
              player={player}
              onArchetypeChange={updateArchetype}
            />
            {player.moxfield_username && statuses[player.id] !== 'loading' && (
              <button
                onClick={() => fetchOne(player)}
                className="mt-1 w-full text-xs text-mtg-muted hover:text-mtg-gold transition-colors text-left px-1"
              >
                {statuses[player.id] === 'done' ? '↺ Re-fetch' : '↓ Fetch decklist'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
