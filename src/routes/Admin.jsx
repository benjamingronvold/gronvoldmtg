import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { ROLES } from '../lib/roles.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Admin() {
  const { profile: currentUser } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [])

  async function handleRoleChange(id, role) {
    setUpdating(id)
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
    } else {
      alert('Feil ved rolleendring: ' + error.message)
    }
    setUpdating(null)
  }

  async function handleDelete(id) {
    setDeleting(id)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    if (!error) {
      setProfiles(prev => prev.filter(p => p.id !== id))
    } else {
      alert('Feil ved sletting: ' + error.message)
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const roleBadgeColor = {
    bruker: 'text-mtg-muted',
    teammedlem: 'text-blue-400',
    admin: 'text-mtg-gold',
    superadmin: 'text-purple-400',
  }

  if (loading) {
    return <div className="text-center py-20 text-mtg-muted animate-pulse">Laster…</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-2xl text-mtg-text">Admin Panel</h1>
      <p className="text-mtg-muted text-sm">{profiles.length} registrerte brukere</p>

      <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-mtg-border">
            <tr>
              {['Navn', 'Discord', 'Registrert', 'Rolle', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">
                  {h}
                </th>
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
                  <td className="px-4 py-3 text-mtg-muted">
                    {profile.discord_username ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-mtg-muted text-xs">
                    {profile.created_at?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={profile.role}
                      disabled={updating === profile.id || isSelf}
                      onChange={e => handleRoleChange(profile.id, e.target.value)}
                      className={`bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm focus:outline-none focus:border-mtg-gold/60 disabled:opacity-50 ${roleBadgeColor[profile.role] ?? 'text-mtg-text'}`}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {!isSelf && (
                      confirmDelete === profile.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Sikker?</span>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            disabled={deleting === profile.id}
                            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30 disabled:opacity-50"
                          >
                            {deleting === profile.id ? '…' : 'Ja, slett'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 text-mtg-muted hover:text-mtg-text"
                          >
                            Avbryt
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(profile.id)}
                          className="text-xs text-mtg-muted hover:text-red-400 transition-colors"
                        >
                          Slett
                        </button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
