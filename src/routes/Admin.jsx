import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { ROLES } from '../lib/roles.js'

export default function Admin() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

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
      alert('Failed to update role: ' + error.message)
    }
    setUpdating(null)
  }

  const roleBadgeColor = {
    bruker: 'text-mtg-muted',
    teammedlem: 'text-blue-400',
    admin: 'text-mtg-gold',
    superadmin: 'text-purple-400',
  }

  if (loading) {
    return <div className="text-center py-20 text-mtg-muted animate-pulse">Loading…</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-2xl text-mtg-text">Admin Panel</h1>
      <p className="text-mtg-muted text-sm">{profiles.length} registered users</p>

      <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-mtg-border">
            <tr>
              {['Display Name', 'Discord', 'Joined', 'Role'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(profile => (
              <tr key={profile.id} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30">
                <td className="px-4 py-3 text-mtg-text font-medium">
                  {profile.display_name ?? '—'}
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
                    disabled={updating === profile.id}
                    onChange={e => handleRoleChange(profile.id, e.target.value)}
                    className={`bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm focus:outline-none focus:border-mtg-gold/60 disabled:opacity-50 ${roleBadgeColor[profile.role] ?? 'text-mtg-text'}`}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
