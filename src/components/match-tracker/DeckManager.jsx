import { useState } from 'react'
import { useDecks } from '../../hooks/useDecks.js'

const FORMATS = ['Modern', 'Legacy', 'Vintage', 'Pioneer', 'Standard', 'Commander', 'Pauper', 'Other']

export default function DeckManager() {
  const { decks, loading, addDeck, updateDeck, deleteDeck } = useDecks()
  const [form, setForm] = useState({ name: '', format: 'Modern', notes: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await addDeck(form)
      setForm({ name: '', format: 'Modern', notes: '' })
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit() {
    try {
      await updateDeck(editingId, editForm)
      setEditingId(null)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDeck(id)
    } catch (err) {
      alert(err.message)
    }
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Add deck form */}
      <div className="bg-mtg-card border border-mtg-border rounded-xl p-5 space-y-4">
        <h3 className="font-display text-sm text-mtg-muted uppercase tracking-wider">Legg til dekk</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Dekknavn *"
              required
              className="flex-1 min-w-48 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
            />
            <select
              value={form.format}
              onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
              className="bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60"
            >
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notater (valgfritt)"
              className="flex-1 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
            />
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="bg-mtg-gold text-mtg-bg font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {saving ? 'Legger til…' : '+ Legg til'}
            </button>
          </div>
        </form>
      </div>

      {/* Deck list */}
      {loading ? (
        <div className="text-center py-8 text-mtg-muted animate-pulse">Laster dekker…</div>
      ) : decks.length === 0 ? (
        <div className="bg-mtg-card border border-mtg-border rounded-xl p-8 text-center text-mtg-muted text-sm">
          Ingen dekker lagt til ennå.
        </div>
      ) : (
        <div className="bg-mtg-card border border-mtg-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-mtg-border">
              <tr>
                {['Dekk', 'Format', 'Notater', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium text-mtg-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decks.map(deck => {
                if (editingId === deck.id) {
                  return (
                    <tr key={deck.id} className="border-b border-mtg-border/50 bg-mtg-gold/5">
                      <td className="px-4 py-2">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-mtg-bg border border-mtg-gold/40 rounded px-2 py-1 text-sm text-mtg-text focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={editForm.format} onChange={e => setEditForm(f => ({ ...f, format: e.target.value }))}
                          className="bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm text-mtg-text focus:outline-none">
                          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                          className="w-full bg-mtg-bg border border-mtg-border rounded px-2 py-1 text-sm text-mtg-text focus:outline-none focus:border-mtg-gold/60" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={handleSaveEdit}
                            className="text-xs px-2 py-1 bg-mtg-gold text-mtg-bg rounded font-medium hover:brightness-110">Lagre</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs px-2 py-1 text-mtg-muted hover:text-mtg-text">Avbryt</button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={deck.id} className="border-b border-mtg-border/50 hover:bg-mtg-bg/30 group">
                    <td className="px-4 py-3 text-mtg-text font-medium">{deck.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-mtg-muted border border-mtg-border/60 rounded px-2 py-0.5">{deck.format}</span>
                    </td>
                    <td className="px-4 py-3 text-mtg-muted text-xs">{deck.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setEditingId(deck.id); setEditForm({ name: deck.name, format: deck.format, notes: deck.notes ?? '' }) }}
                          className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors px-1.5 py-0.5 border border-transparent hover:border-mtg-border rounded"
                        >✎</button>
                        {confirmDelete === deck.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(deck.id)}
                              className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30">Slett</button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="text-xs text-mtg-muted hover:text-mtg-text">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(deck.id)}
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
      )}
    </div>
  )
}
