import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { ROLES } from '../lib/roles.js'
import { useAuth } from '../hooks/useAuth.jsx'

const EMPTY_PLAYER_FORM = { display_name: '', moxfield_username: '', mtgo_username: '', archetype: '' }

export default function Admin() {
  const { profile: currentUser } = useAuth()
  const [tab, setTab] = useState('brukere')

  // --- Brukere ---
  const [profiles, setProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // --- Spillere ---
  const [players, setPlayers] = useState([])
  const [tournamentPlayers, setTournamentPlayers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [playerForm, setPlayerForm] = useState(EMPTY_PLAYER_FORM)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [deletingPlayer, setDeletingPlayer] = useState(null)
  const [confirmDeletePlayer, setConfirmDeletePlayer] = useState(null)
  const [playerSearch, setPlayerSearch] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at').then(({ data }) => {
      setProfiles(data ?? [])
      setLoadingProfiles(false)
    })
    fetchPlayersData()
  }, [])

  async function fetchPlayersData() {
    setLoadingPlayers(true)
    const [{ data: p }, { data: tp }, { data: t }] = await Promise.all([
      supabase.from('players').select('*').order('display_name'),
      supabase.from('tournament_players').select('display_name, archetype, tournament_id'),
      supabase.from('tournaments').select('id, name, date').order('date', { ascending: false }),
    ])
    setPlayers(p ?? [])
    setTournamentPlayers(tp ?? [])
    setTournaments(t ?? [])
    setLoadingPlayers(false)
  }

  // Compute most played deck + last tournament per player
  const playerStats = useMemo(() => {
    const tournamentById = Object.fromEntries((tournaments ?? []).map(t => [t.id, t]))
    return Object.fromEntries(
      (players ?? []).map(player => {
        const entries = tournamentPlayers.filter(
          tp => tp.display_name?.toLowerCase() === player.display_name?.toLowerCase()
        )
        // most played archetype
        const archetypeCounts = {}
        for (const e of entries) {
          if (e.archetype) archetypeCounts[e.archetype] = (archetypeCounts[e.archetype] ?? 0) + 1
        }
        const mostPlayed = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

        // last tournament by date
        const participated = entries
          .map(e => tournamentById[e.tournament_id])
          .filter(Boolean)
          .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        const lastTournament = participated[0] ?? null

        return [player.id, { mostPlayed, lastTournament, count: entries.length }]
      })
    )
  }, [players, tournamentPlayers, tournaments])

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.toLowerCase()
    if (!q) return players
    return players.filter(p =>
      p.display_name.toLowerCase().includes(q) ||
      (p.archetype ?? '').toLowerCase().includes(q) ||
      (p.moxfield_username ?? '').toLowerCase().includes(q)
    )
  }, [players, playerSearch])

  async function handleAddPlayer(e) {
    e.preventDefault()
    if (!playerForm.display_name.trim()) return
    setAddingPlayer(true)
    const { data, error } = await supabase
      .from('players')
      .insert({ ...playerForm })
      .select()
      .single()
    setAddingPlayer(false)
    if (error) { alert(error.message); return }
    setPlayers(prev => [...prev, data].sort((a, b) => a.display_name.localeCompare(b.display_name)))
    setPlayerForm(EMPTY_PLAYER_FORM)
  }

  async function handleSaveEdit() {
    const { error } = await supabase
      .from('players')
      .update({
        display_name: editingPlayer.display_name,
        moxfield_username: editingPlayer.moxfield_username,
        mtgo_username: editingPlayer.mtgo_username,
        archetype: editingPlayer.archetype,
      })
      .eq('id', editingPlayer.id)
    if (error) { alert(error.message); return }
    setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...editingPlayer } : p))
    setEditingPlayer(null)
  }

  async function handleDeletePlayer(id) {
    setDeletingPlayer(id)
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (!error) setPlayers(prev => prev.filter(p => p.id !== id))
    else alert(error.message)
    setDeletingPlayer(null)
    setConfirmDeletePlayer(null)
  }

  // --- Brukere handlers ---
  async function handleRoleChange(id, role) {
    setUpdating(id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (!error) setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
    else alert('Feil ved rolleendring: ' + error.message)
    setUpdating(null)
  }

  async function handleDelete(id) {
    setDeleting(id)
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) setProfiles(prev => prev.filter(p => p.id !== id))
    else alert('Feil ved sletting: ' + error.message)
    setDeleting(null)
    setConfirmDelete(null)
  }

  const roleBadgeColor = {
    bruker: 'text-mtg-muted',
    teammedlem: 'text-blue-400',
    admin: 'text-mtg-gold',
    superadmin: 'text-purple-400',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-2xl text-mtg-text">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-mtg-card border border-mtg-border rounded-lg p-1 w-fit">
        {[['brukere', 'Brukere'], ['spillere', 'Spillere']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all
              ${tab === key ? 'bg-mtg-gold text-mtg-bg' : 'text-mtg-muted hover:text-mtg-text'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- BRUKERE ---- */}
      {tab === 'brukere' && (
        <>
          {loadingProfiles ? (
            <div className="text-center py-20 text-mtg-muted animate-pulse">Laster…</div>
          ) : (
            <>
              <p className="text-mtg-muted text-sm">{profiles.length} registrerte brukere</p>
              <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-mtg-border">
                    <tr>
                      {['Navn', 'Discord', 'Registrert', 'Rolle', ''].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(profile => {
                      const isSelf = profile.id === currentUser?.id
                      return (
                        <tr key={profile.id} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30">
                          <td className="px-4 py-3 text-mtg-text font-medium">
                            {profile.display_name ?? '—'}
                            {isSelf && <span className="ml-2 text-xs text-mtg-muted">(deg)</span>}
                          </td>
                          <td className="px-4 py-3 text-mtg-muted">{profile.discord_username ?? '—'}</td>
                          <td className="px-4 py-3 text-mtg-muted text-xs">{profile.created_at?.slice(0, 10)}</td>
                          <td className="px-4 py-3">
                            <select
                              value={profile.role}
                              disabled={updating === profile.id || isSelf}
                              onChange={e => handleRoleChange(profile.id, e.target.value)}
                              className={`bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm focus:outline-none focus:border-mtg-gold/60 disabled:opacity-50 ${roleBadgeColor[profile.role] ?? 'text-mtg-text'}`}
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {!isSelf && (
                              confirmDelete === profile.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-400">Sikker?</span>
                                  <button onClick={() => handleDelete(profile.id)} disabled={deleting === profile.id}
                                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30 disabled:opacity-50">
                                    {deleting === profile.id ? '…' : 'Ja, slett'}
                                  </button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 text-mtg-muted hover:text-mtg-text">Avbryt</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete(profile.id)} className="text-xs text-mtg-muted hover:text-red-400 transition-colors">Slett</button>
                              )
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ---- SPILLERE ---- */}
      {tab === 'spillere' && (
        <div className="space-y-6">
          {/* Legg til spiller */}
          <div className="bg-mtg-card border border-mtg-border rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm text-mtg-muted uppercase tracking-wider">Legg til spiller</h3>
            <form onSubmit={handleAddPlayer} className="flex flex-wrap gap-2">
              <input
                value={playerForm.display_name}
                onChange={e => setPlayerForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Navn *"
                required
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <input
                value={playerForm.moxfield_username}
                onChange={e => setPlayerForm(f => ({ ...f, moxfield_username: e.target.value }))}
                placeholder="Moxfield username"
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <input
                value={playerForm.mtgo_username}
                onChange={e => setPlayerForm(f => ({ ...f, mtgo_username: e.target.value }))}
                placeholder="MTGO username"
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <input
                value={playerForm.archetype}
                onChange={e => setPlayerForm(f => ({ ...f, archetype: e.target.value }))}
                placeholder="Standarddeck"
                className="flex-1 min-w-32 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
              />
              <button
                type="submit"
                disabled={addingPlayer}
                className="bg-mtg-gold text-mtg-bg font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all whitespace-nowrap"
              >
                {addingPlayer ? 'Legger til…' : '+ Legg til'}
              </button>
            </form>
          </div>

          {/* Søk + tabell */}
          {loadingPlayers ? (
            <div className="text-center py-10 text-mtg-muted animate-pulse">Laster spillere…</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <input
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                  placeholder="Søk etter spiller…"
                  className="w-64 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
                />
                <span className="text-xs text-mtg-muted">{filteredPlayers.length} spillere</span>
              </div>

              <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-mtg-border">
                    <tr>
                      {['Navn', 'Moxfield / MTGO', 'Mest spilte deck', 'Siste turnering', 'Turneringer', ''].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-mtg-muted text-sm">
                          {playerSearch ? `Ingen treff på «${playerSearch}»` : 'Ingen spillere ennå.'}
                        </td>
                      </tr>
                    ) : filteredPlayers.map(player => {
                      const stats = playerStats[player.id] ?? {}
                      const isEditing = editingPlayer?.id === player.id

                      if (isEditing) {
                        return (
                          <tr key={player.id} className="border-b border-mtg-border/50 bg-mtg-gold/5">
                            <td className="px-4 py-2">
                              <input value={editingPlayer.display_name} onChange={e => setEditingPlayer(p => ({ ...p, display_name: e.target.value }))}
                                className="w-full bg-mtg-bg border border-mtg-gold/40 rounded px-2 py-1 text-sm text-mtg-text focus:outline-none" />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-1">
                                <input value={editingPlayer.moxfield_username ?? ''} onChange={e => setEditingPlayer(p => ({ ...p, moxfield_username: e.target.value }))}
                                  placeholder="Moxfield" className="bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-xs text-mtg-text focus:outline-none focus:border-mtg-gold/60" />
                                <input value={editingPlayer.mtgo_username ?? ''} onChange={e => setEditingPlayer(p => ({ ...p, mtgo_username: e.target.value }))}
                                  placeholder="MTGO" className="bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-xs text-mtg-text focus:outline-none focus:border-mtg-gold/60" />
                              </div>
                            </td>
                            <td className="px-4 py-2" colSpan={2}>
                              <input value={editingPlayer.archetype ?? ''} onChange={e => setEditingPlayer(p => ({ ...p, archetype: e.target.value }))}
                                placeholder="Standarddeck" className="w-full bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60" />
                            </td>
                            <td className="px-4 py-2 text-center text-mtg-muted text-xs">{stats.count ?? 0}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button onClick={handleSaveEdit}
                                  className="text-xs px-2 py-1 bg-mtg-gold text-mtg-bg rounded font-medium hover:brightness-110">Lagre</button>
                                <button onClick={() => setEditingPlayer(null)}
                                  className="text-xs px-2 py-1 text-mtg-muted hover:text-mtg-text">Avbryt</button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={player.id} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30 group">
                          <td className="px-4 py-3 text-mtg-text font-medium">{player.display_name}</td>
                          <td className="px-4 py-3 text-mtg-muted text-xs">
                            {player.moxfield_username && <div>Mox: {player.moxfield_username}</div>}
                            {player.mtgo_username && <div>MTGO: {player.mtgo_username}</div>}
                            {!player.moxfield_username && !player.mtgo_username && '—'}
                          </td>
                          <td className="px-4 py-3">
                            {stats.mostPlayed
                              ? <span className="text-mtg-gold text-sm font-medium">{stats.mostPlayed}</span>
                              : <span className="text-mtg-muted text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-mtg-muted text-xs">
                            {stats.lastTournament
                              ? <div><div className="text-mtg-text text-sm">{stats.lastTournament.name}</div><div>{stats.lastTournament.date}</div></div>
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-mtg-muted text-sm">{stats.count ?? 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => setEditingPlayer({ ...player })}
                                className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors px-1.5 py-0.5 border border-transparent hover:border-mtg-border rounded">✎</button>
                              {confirmDeletePlayer === player.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDeletePlayer(player.id)} disabled={deletingPlayer === player.id}
                                    className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30 disabled:opacity-50">
                                    {deletingPlayer === player.id ? '…' : 'Slett'}
                                  </button>
                                  <button onClick={() => setConfirmDeletePlayer(null)} className="text-xs text-mtg-muted hover:text-mtg-text">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeletePlayer(player.id)}
                                  className="text-xs text-mtg-muted hover:text-red-400 transition-colors px-1.5 py-0.5 border border-transparent hover:border-mtg-border rounded">✕</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
