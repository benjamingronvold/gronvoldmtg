import { useState } from 'react'

export default function PlayerCard({ player, onUpdate, onDelete, onArchetypeChange }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name: player.display_name ?? '',
    moxfield_username: player.moxfield_username ?? '',
    mtgo_username: player.mtgo_username ?? '',
    archetype: player.archetype ?? '',
    decklist_url: player.decklist_url ?? '',
  })

  async function handleSave() {
    setSaving(true)
    await onUpdate?.(player.id, form)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setForm({
      display_name: player.display_name ?? '',
      moxfield_username: player.moxfield_username ?? '',
      mtgo_username: player.mtgo_username ?? '',
      archetype: player.archetype ?? '',
      decklist_url: player.decklist_url ?? '',
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-mtg-card border border-mtg-gold/40 rounded-xl p-4 space-y-3">
        <p className="text-xs text-mtg-muted uppercase tracking-wider font-medium">Rediger spiller</p>

        <input
          value={form.display_name}
          onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
          placeholder="Display name *"
          className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />
        <div className="flex gap-2">
          <input
            value={form.moxfield_username}
            onChange={e => setForm(f => ({ ...f, moxfield_username: e.target.value }))}
            placeholder="Moxfield username"
            className="flex-1 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
          />
          <input
            value={form.mtgo_username}
            onChange={e => setForm(f => ({ ...f, mtgo_username: e.target.value }))}
            placeholder="MTGO username"
            className="flex-1 bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
          />
        </div>
        <input
          value={form.archetype}
          onChange={e => setForm(f => ({ ...f, archetype: e.target.value }))}
          placeholder="Archetype"
          className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />
        <input
          value={form.decklist_url}
          onChange={e => setForm(f => ({ ...f, decklist_url: e.target.value }))}
          placeholder="Decklist URL"
          type="url"
          className="w-full bg-mtg-bg border border-mtg-border rounded-lg px-3 py-2 text-sm text-mtg-text placeholder:text-mtg-muted focus:outline-none focus:border-mtg-gold/60"
        />

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !form.display_name.trim()}
            className="flex-1 bg-mtg-gold text-mtg-bg font-semibold text-sm py-1.5 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 border border-mtg-border text-mtg-muted text-sm py-1.5 rounded-lg hover:text-mtg-text transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-mtg-card border border-mtg-border rounded-xl p-4 flex flex-col gap-2 group relative">
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
        {onUpdate && (
          <button
            onClick={() => setEditing(true)}
            title="Rediger"
            className="text-mtg-muted hover:text-mtg-gold transition-colors text-xs px-1.5 py-0.5 rounded border border-transparent hover:border-mtg-border"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(player.id)}
            title="Fjern"
            className="text-mtg-muted hover:text-red-400 transition-colors text-xs px-1.5 py-0.5 rounded border border-transparent hover:border-mtg-border"
          >
            ✕
          </button>
        )}
      </div>

      <div>
        <p className="font-semibold text-mtg-text pr-12">{player.display_name}</p>
        {player.moxfield_username && (
          <p className="text-xs text-mtg-muted">Moxfield: {player.moxfield_username}</p>
        )}
        {player.mtgo_username && (
          <p className="text-xs text-mtg-muted">MTGO: {player.mtgo_username}</p>
        )}
      </div>

      {/* Archetype — inline edit hvis onArchetypeChange finnes (DecklistFetcher), ellers visning */}
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

      <div className="flex items-center gap-2">
        {player.decklist_url && (
          <a
            href={player.decklist_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-mtg-muted hover:text-mtg-gold transition-colors"
          >
            View decklist →
          </a>
        )}
        {player.scraped_at && (
          <span className="text-xs text-mtg-success border border-mtg-success/30 rounded-full px-2 py-0.5 ml-auto">
            Fetched
          </span>
        )}
      </div>
    </div>
  )
}
