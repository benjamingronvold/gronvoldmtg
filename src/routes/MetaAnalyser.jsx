import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import TournamentBuilder from '../components/meta/TournamentBuilder.jsx'
import DecklistFetcher from '../components/meta/DecklistFetcher.jsx'
import MetaPieChart from '../components/meta/MetaPieChart.jsx'
import PlayerCard from '../components/meta/PlayerCard.jsx'

export default function MetaAnalyser() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [activeTournament, setActiveTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [tab, setTab] = useState('players')
  const [addForm, setAddForm] = useState({ display_name: '', moxfield_username: '', mtgo_username: '' })
  const [addingPlayer, setAddingPlayer] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  async function fetchTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: false })
    setTournaments(data ?? [])
  }

  async function fetchPlayers(tournamentId) {
    setLoadingPlayers(true)
    const { data } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('display_name')
    setPlayers(data ?? [])
    setLoadingPlayers(false)
  }

  function handleTournamentCreated(tournament) {
    setTournaments(prev => [tournament, ...prev])
    selectTournament(tournament)
  }

  function selectTournament(tournament) {
    setActiveTournament(tournament)
    fetchPlayers(tournament.id)
    setTab('players')
  }

  async function handleAddPlayer(e) {
    e.preventDefault()
    if (!addForm.display_name.trim()) return
    setAddingPlayer(true)
    const { data, error } = await supabase
      .from('tournament_players')
      .insert({ ...addForm, tournament_id: activeTournament.id })
      .select()
      .single()
    setAddingPlayer(false)
    if (error) { alert(error.message); return }
    setPlayers(prev => [...prev, data])
    setAddForm({ display_name: '', moxfield_username: '', mtgo_username: '' })
  }

  async function handleDeletePlayer(id) {
    if (!confirm('Remove this player?')) return
    await supabase.from('tournament_players').delete().eq('id', id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="font-display text-2xl text-mtg-text">Meta Analyser</h1>

      <TournamentBuilder onCreated={handleTournamentCreated} />

      {tournaments.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-base text-mtg-muted uppercase tracking-wider">Tournaments</h2>
          <div className="flex flex-wrap gap-2">
            {tournaments.map(t => (
              <button
                key={t.id}
                onClick={() => selectTournament(t)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                  ${activeTournament?.id === t.id
                    ? 'bg-mtg-gold text-mtg-bg border-mtg-gold'
                    : 'bg-mtg-card border-mtg-border text-mtg-muted hover:border-mtg-gold/40 hover:text-mtg-text'
                  }`}
              >
                {t.name} <span className="opacity-60 text-xs ml-1">{t.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTournament && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl text-mtg-gold">{activeTournament.name}</h2>
            <span className="text-mtg-muted text-sm">{activeTournament.date} · {players.length} players</span>
          </div>

          {/* Add player form */}
          <form onSubmit={handleAddPlayer} className="bg-mtg-card border border-mtg-border rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm text-mtg-muted uppercase tracking-wider">Add Player</h3>
            <div className="flex flex-wrap gap-2">
              <input
                value={addForm.display_name}
                onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Display name *"
                required
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <input
                value={addForm.moxfield_username}
                onChange={e => setAddForm(f => ({ ...f, moxfield_username: e.target.value }))}
                placeholder="Moxfield username"
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <input
                value={addForm.mtgo_username}
                onChange={e => setAddForm(f => ({ ...f, mtgo_username: e.target.value }))}
                placeholder="MTGO username"
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <button
                type="submit"
                disabled={addingPlayer}
                className="bg-mtg-gold text-mtg-bg font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all whitespace-nowrap"
              >
                {addingPlayer ? 'Adding…' : '+ Add'}
              </button>
            </div>
          </form>

          {/* Tabs */}
          <div className="flex gap-1 bg-mtg-card border border-mtg-border rounded-lg p-1 w-fit">
            {['players', 'fetch', 'meta'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-all
                  ${tab === t ? 'bg-mtg-gold text-mtg-bg' : 'text-mtg-muted hover:text-mtg-text'}`}
              >
                {t === 'fetch' ? 'Fetch Decklists' : t === 'meta' ? 'Meta View' : 'Players'}
              </button>
            ))}
          </div>

          {loadingPlayers ? (
            <div className="text-center py-8 text-mtg-muted animate-pulse">Loading…</div>
          ) : (
            <>
              {tab === 'players' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {players.length === 0 ? (
                    <p className="text-mtg-muted text-sm col-span-full py-4">
                      No players added yet.
                    </p>
                  ) : (
                    players.map(p => (
                      <div key={p.id} className="relative group">
                        <PlayerCard player={p} />
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="absolute top-3 right-3 text-mtg-muted hover:text-mtg-danger opacity-0 group-hover:opacity-100 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'fetch' && (
                <DecklistFetcher
                  players={players}
                  tournamentId={activeTournament.id}
                  onPlayersUpdated={() => fetchPlayers(activeTournament.id)}
                />
              )}

              {tab === 'meta' && (
                <div className="space-y-6">
                  <MetaPieChart players={players} />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.filter(p => p.archetype).map(p => (
                      <PlayerCard key={p.id} player={p} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
