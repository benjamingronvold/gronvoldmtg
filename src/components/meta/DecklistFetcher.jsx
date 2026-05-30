import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import PlayerCard from './PlayerCard.jsx'

const NOW = Date.now()
const MS_30D = 30 * 24 * 60 * 60 * 1000
const MS_48H = 48 * 60 * 60 * 1000

async function fetchMoxfieldDecks(username) {
  const url = `https://api.moxfield.com/v2/users/${encodeURIComponent(username)}/decks?pageSize=100&sortType=updated&sortDirection=Descending`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Origin': 'https://www.moxfield.com',
      'Referer': 'https://www.moxfield.com/',
    },
  })
  if (!res.ok) throw new Error(`Moxfield svarte ${res.status}`)
  const json = await res.json()
  const decks = json.data ?? json.decks ?? []

  const filtered = decks
    .filter(d => {
      const fmt = (d.format ?? '').toLowerCase()
      if (fmt !== 'modern') return false
      const updated = new Date(d.lastUpdatedAtUtc ?? d.updatedAtUtc ?? d.createdAtUtc).getTime()
      return NOW - updated <= MS_30D
    })
    .map(d => {
      const updated = new Date(d.lastUpdatedAtUtc ?? d.updatedAtUtc ?? d.createdAtUtc).getTime()
      const isRecent = NOW - updated <= MS_48H
      const daysAgo = Math.floor((NOW - updated) / (24 * 60 * 60 * 1000))
      const hoursAgo = Math.floor((NOW - updated) / (60 * 60 * 1000))
      return {
        id: d.publicId,
        name: d.name,
        url: `https://www.moxfield.com/decks/${d.publicId}`,
        isRecent,
        ageLabel: isRecent
          ? (hoursAgo < 1 ? 'Akkurat nå' : `${hoursAgo}t siden`)
          : `${daysAgo}d siden`,
      }
    })
    .sort((a, b) => (b.isRecent ? 1 : 0) - (a.isRecent ? 1 : 0))

  return filtered
}

export default function DecklistFetcher({ players, tournamentId, onPlayersUpdated }) {
  const [statuses, setStatuses] = useState({})
  const [deckOptions, setDeckOptions] = useState({}) // playerId → deck[]
  const [localPlayers, setLocalPlayers] = useState(players)
  const [selectedDecks, setSelectedDecks] = useState({}) // playerId → deck

  const fetchablePlayers = localPlayers.filter(p => p.moxfield_username)

  function setStatus(id, status) {
    setStatuses(s => ({ ...s, [id]: status }))
  }

  async function fetchOne(player) {
    setStatus(player.id, 'loading')
    try {
      const decks = await fetchMoxfieldDecks(player.moxfield_username)
      setDeckOptions(prev => ({ ...prev, [player.id]: decks }))
      if (decks.length === 0) {
        setStatus(player.id, 'empty')
      } else {
        setStatus(player.id, 'done')
        // Auto-select first (highest priority) deck
        setSelectedDecks(prev => ({ ...prev, [player.id]: decks[0] }))
      }
    } catch (err) {
      setStatus(player.id, `error:${err.message}`)
    }
  }

  async function fetchAll() {
    for (const p of fetchablePlayers) {
      await fetchOne(p)
    }
  }

  async function saveDeck(player, deck) {
    const updates = {
      decklist_url: deck.url,
      scraped_at: new Date().toISOString(),
    }
    await supabase.from('tournament_players').update(updates).eq('id', player.id)
    setLocalPlayers(prev => prev.map(p => p.id === player.id ? { ...p, ...updates } : p))
    onPlayersUpdated?.()
  }

  async function updateArchetype(playerId, archetype) {
    setLocalPlayers(prev => prev.map(p => p.id === playerId ? { ...p, archetype } : p))
    await supabase.from('tournament_players').update({ archetype }).eq('id', playerId)
    onPlayersUpdated?.()
  }

  if (fetchablePlayers.length === 0) {
    return (
      <p className="text-mtg-muted text-sm py-4">
        Ingen spillere med Moxfield-brukernavn. Legg til Moxfield-brukernavn når du legger til spillere.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mtg-muted">
          {fetchablePlayers.length} spiller{fetchablePlayers.length !== 1 ? 'e' : ''} med Moxfield-brukernavn
        </p>
        <button
          onClick={fetchAll}
          className="bg-mtg-gold/20 border border-mtg-gold/40 text-mtg-gold text-sm px-3 py-1.5 rounded-lg hover:bg-mtg-gold/30 transition-colors"
        >
          Hent alle
        </button>
      </div>

      <div className="space-y-6">
        {localPlayers.map(player => {
          const status = statuses[player.id]
          const decks = deckOptions[player.id] ?? []
          const selected = selectedDecks[player.id]

          return (
            <div key={player.id} className="bg-mtg-card border border-mtg-border rounded-xl p-4 space-y-3">
              {/* Player header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-mtg-text">{player.display_name}</p>
                  {player.moxfield_username && (
                    <a
                      href={`https://moxfield.com/users/${player.moxfield_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors"
                    >
                      moxfield.com/users/{player.moxfield_username}
                    </a>
                  )}
                </div>
                {player.moxfield_username && status !== 'loading' && (
                  <button
                    onClick={() => fetchOne(player)}
                    className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors border border-mtg-border rounded px-2.5 py-1"
                  >
                    {status ? '↺ Oppdater' : '↓ Hent decklists'}
                  </button>
                )}
                {status === 'loading' && (
                  <span className="text-xs text-mtg-gold animate-pulse">Henter…</span>
                )}
              </div>

              {/* Error */}
              {status?.startsWith('error:') && (
                <p className="text-xs text-red-400 bg-red-900/20 rounded px-3 py-2">
                  {status.replace('error:', '')}
                </p>
              )}

              {/* Empty */}
              {status === 'empty' && (
                <p className="text-xs text-mtg-muted">
                  Ingen Modern-decklists oppdatert siste 30 dager funnet.
                </p>
              )}

              {/* Deck list */}
              {decks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-mtg-muted uppercase tracking-wider font-medium">
                    {decks.length} Modern-deck{decks.length !== 1 ? 's' : ''} — siste 30 dager
                  </p>
                  <div className="space-y-1">
                    {decks.map(deck => (
                      <label
                        key={deck.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all
                          ${selected?.id === deck.id
                            ? 'border-mtg-gold/60 bg-mtg-gold/5'
                            : 'border-mtg-border hover:border-mtg-border/80'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`deck-${player.id}`}
                          checked={selected?.id === deck.id}
                          onChange={() => setSelectedDecks(prev => ({ ...prev, [player.id]: deck }))}
                          className="accent-mtg-gold"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-mtg-text truncate">{deck.name}</p>
                          <a
                            href={deck.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors"
                          >
                            {deck.url.replace('https://', '')}
                          </a>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {deck.isRecent && (
                            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                              Nylig
                            </span>
                          )}
                          <span className="text-xs text-mtg-muted">{deck.ageLabel}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selected && (
                    <button
                      onClick={() => saveDeck(player, selected)}
                      className="mt-1 text-xs bg-mtg-gold text-mtg-bg font-semibold px-3 py-1.5 rounded hover:brightness-110 transition-all"
                    >
                      Bruk «{selected.name}»
                    </button>
                  )}
                </div>
              )}

              {/* Current saved decklist */}
              {player.decklist_url && (
                <div className="text-xs text-mtg-muted border-t border-mtg-border/40 pt-2">
                  Lagret:{' '}
                  <a href={player.decklist_url} target="_blank" rel="noopener noreferrer" className="hover:text-mtg-gold transition-colors">
                    {player.decklist_url.replace('https://', '')}
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
