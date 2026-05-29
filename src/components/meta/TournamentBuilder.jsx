import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function TournamentBuilder({ onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('tournaments')
      .insert({ ...form, created_by: user.id })
      .select()
      .single()
    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated?.(data)
    setForm({ name: '', date: new Date().toISOString().slice(0, 10) })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-mtg-card border border-mtg-border rounded-xl p-6 space-y-4">
      <h2 className="font-display text-lg text-mtg-gold">New Tournament</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Tournament name"
          required
          className="flex-1 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          required
          className="bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-mtg-gold text-mtg-bg font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all whitespace-nowrap"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  )
}
