import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import TournamentBuilder from '../components/meta/TournamentBuilder.jsx'
import DecklistFetcher from '../components/meta/DecklistFetcher.jsx'
import MetaPieChart from '../components/meta/MetaPieChart.jsx'
import PlayerCard from '../components/meta/PlayerCard.jsx'
import PlayerChecklist from '../components/meta/PlayerChecklist.jsx'

const EMPTY_FORM = { display_name: '', moxfield_username: '', mtgo_username: '', archetype: '', decklist_url: '' }

export default function MetaAnalyser() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [activeTournament, setActiveTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [tab, setTab] = useState('players')

  // Spillerdatabase
  const [dbPlayers, setDbPlayers] = useState([])
  const [addMode, setAddMode] = useState('form') // 'form' | 'checklist'
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [dbSearch, setDbSearch] = useState('')

  useEffect(() => {
    fetchTournaments()
    fetchDbPlayers()
  }, [])

  async function fetchTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: false })
    setTournaments(data ?? [])
  }

  async function fetchDbPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('display_name')
    setDbPlayers(data ?? [])
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

  // Velg spiller fra dropdown — fyll inn skjema
  function handleSelectFromDb(player) {
    setAddForm({
      display_name: player.display_name,
      moxfield_username: player.moxfield_username ?? '',
      mtgo_username: player.mtgo_username ?? '',
      archetype: player.archetype ?? '',
      decklist_url: player.decklist_url ?? '',
    })
    setDbSearch('')
  }

  // Legg til én spiller via skjema, lagre også i spillerdatabase
  async function handleAddPlayer(e) {
    e.preventDefault()
    if (!addForm.display_name.trim()) return
    setAddingPlayer(true)

    const [tpResult, dbResult] = await Promise.all([
      supabase
        .from('tournament_players')
        .insert({ ...addForm, tournament_id: activeTournament.id })
        .select()
        .single(),
      supabase
        .from('players')
        .upsert(
          { ...addForm },
          { onConflict: 'display_name', ignoreDuplicates: false }
        )
        .select()
        .single(),
    ])

    setAddingPlayer(false)
    if (tpResult.error) { alert(tpResult.error.message); return }

    setPlayers(prev => [...prev, tpResult.data])
    if (dbResult.data) {
      setDbPlayers(prev => {
        const exists = prev.find(p => p.id === dbResult.data.id)
        return exists ? prev.map(p => p.id === dbResult.data.id ? dbResult.data : p) : [...prev, dbResult.data]
      })
    }
    setAddForm(EMPTY_FORM)
  }

  // Bulk-legg til fra sjekkliste
  async function handleBulkAdd(selectedPlayers) {
    setAddingPlayer(true)
    const existing = new Set(players.map(p => p.display_name.toLowerCase()))
    const toAdd = selectedPlayers.filter(p => !existing.has(p.display_name.toLowerCase()))

    if (toAdd.length === 0) {
      setAddingPlayer(false)
      return
    }

    const rows = toAdd.map(p => ({
      display_name: p.display_name,
      moxfield_username: p.moxfield_username ?? null,
      mtgo_username: p.mtgo_username ?? null,
      archetype: p.archetype ?? null,
      decklist_url: p.decklist_url ?? null,
      tournament_id: activeTournament.id,
    }))

    const { data, error } = await supabase
      .from('tournament_players')
      .insert(rows)
      .select()

    setAddingPlayer(false)
    if (error) { alert(error.message); return }
    setPlayers(prev => [...prev, ...(data ?? [])])
  }

  async function handleDeletePlayer(id) {
    if (!confirm('Remove this player?')) return
    await supabase.from('tournament_players').delete().eq('id', id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  async function handleUpdatePlayer(id, changes) {
    const { error } = await supabase.from('tournament_players').update(changes).eq('id', id)
    if (error) { alert(error.message); return }
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
  }

  // Dropdown-filtrering
  const dropdownSuggestions = useMemo(() => {
    if (!dbSearch.trim()) return []
    const q = dbSearch.toLowerCase()
    return dbPlayers
      .filter(p =>
        p.display_name.toLowerCase().includes(q) ||
        (p.archetype ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [dbPlayers, dbSearch])

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

          {/* Add player */}
          <div className="bg-mtg-card border border-mtg-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm text-mtg-muted uppercase tracking-wider">Add Player</h3>
              <div className="flex gap-1 bg-mtg-bg border border-mtg-border rounded-lg p-0.5">
                {[['form', 'Manuelt'], ['checklist', 'Sjekkliste']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setAddMode(mode)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all
                      ${addMode === mode ? 'bg-mtg-gold text-mtg-bg' : 'text-mtg-muted hover:text-mtg-text'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {addMode === 'checklist' ? (
              <PlayerChecklist
                players={dbPlayers}
                onAddSelected={handleBulkAdd}
                loading={addingPlayer}
              />
            ) : (
              <form onSubmit={handleAddPlayer} className="space-y-3">
                {/* Dropdown-søk fra spillerdatabase */}
                {dbPlayers.length > 0 && (
                  <div className="relative">
                    <input
                      value={dbSearch}
                      onChange={e => setDbSearch(e.target.value)}
                      placeholder={`Søk i spillerdatabase (${dbPlayers.length} spillere)…`}
                      className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
                    />
                    {dropdownSuggestions.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-mtg-card border border-mtg-border rounded-lg shadow-xl overflow-hidden">
                        {dropdownSuggestions.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectFromDb(p)}
                            className="w-full text-left px-3 py-2.5 hover:bg-mtg-gold/10 transition-colors border-b border-mtg-border/40 last:border-0"
                          >
                            <p className="text-sm text-mtg-text font-medium">{p.display_name}</p>
                            <p className="text-xs text-mtg-muted">
                              {[p.archetype, p.moxfield_username].filter(Boolean).join(' · ') || 'Ingen info'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skjemafelt */}
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
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={addForm.archetype}
                    onChange={e => setAddForm(f => ({ ...f, archetype: e.target.value }))}
                    placeholder="Archetype (valgfritt)"
                    className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
                  />
                  <input
                    value={addForm.decklist_url}
                    onChange={e => setAddForm(f => ({ ...f, decklist_url: e.target.value }))}
                    placeholder="Decklist URL (valgfritt)"
                    type="url"
                    className="flex-1 min-w-48 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
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
            )}
          </div>

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
                      <PlayerCard
                        key={p.id}
                        player={p}
                        onUpdate={handleUpdatePlayer}
                        onDelete={handleDeletePlayer}
                      />
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
