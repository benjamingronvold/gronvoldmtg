import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '../../hooks/useStorage.js'

export default function QuickCreate({ onSave, onCancel }) {
  const { saveScenario } = useStorage()
  const [form, setForm] = useState({
    name: '',
    description: '',
    difficulty: 'intermediate',
    tags: '',
    winCondition: '',
    solutionNotes: '',
    stepsText: '',
  })
  const [errors, setErrors] = useState([])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    const errs = []
    if (!form.name.trim()) errs.push('Navn er påkrevd')
    const steps = form.stepsText.split('\n').map(s => s.trim()).filter(Boolean)
    if (steps.length === 0) errs.push('Minst ett steg er påkrevd')
    if (errs.length > 0) { setErrors(errs); return }

    const scenario = {
      id: uuidv4(),
      name: form.name.trim(),
      description: form.description.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      difficulty: form.difficulty,
      source: 'custom',
      boardstate: {
        battlefield: [],
        hand: [],
        graveyard: [],
        floating: { W: 0, U: 0, B: 0, R: 0, G: 0, colorless: 0 },
        life: 20,
      },
      opponent: { enabled: false, note: '', deck: '' },
      solution: {
        winCondition: form.winCondition.trim(),
        notes: form.solutionNotes.trim(),
        steps: steps.map((action, i) => ({ step: i + 1, action, floating: '', notes: '' })),
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timesAttempted: 0,
        timesSolved: 0,
      },
    }

    saveScenario(scenario)
    onSave()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-mtg-text mb-1">Nytt scenario — hurtigopprett</h2>
        <p className="text-sm text-mtg-muted">Fyll inn tekst for å opprette et scenario raskt. Vil du legge til boardstate kan du redigere scenariet etterpå.</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3">
          {errors.map((e, i) => <p key={i} className="text-red-400 text-sm">• {e}</p>)}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Navn *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="f.eks. Turn 3 Titan lethal"
            className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Beskrivelse</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Beskriv situasjonen kort…"
            rows={2}
            className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Vanskelighetsgrad</label>
            <select
              value={form.difficulty}
              onChange={e => set('difficulty', e.target.value)}
              className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Tags</label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="kommaseparert"
              className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Seiersbetingelse</label>
          <input
            value={form.winCondition}
            onChange={e => set('winCondition', e.target.value)}
            placeholder="f.eks. Infinite mana → Primeval Titan lethal"
            className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">Nøkkelpunkt / notater</label>
          <input
            value={form.solutionNotes}
            onChange={e => set('solutionNotes', e.target.value)}
            placeholder="f.eks. Husk å bruke Amulet før du legger land"
            className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-mtg-muted uppercase tracking-wider">
            Løsningssteg * <span className="normal-case font-normal">(ett steg per linje)</span>
          </label>
          <textarea
            value={form.stepsText}
            onChange={e => set('stepsText', e.target.value)}
            placeholder={`Legg ned Simic Growth Chamber\nBounce Amulet of Vigor\nLegg ned Sunhome, tap for mana\nCast Primeval Titan`}
            rows={6}
            className="w-full bg-mtg-card border border-mtg-border text-mtg-text rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-mtg-gold/60 resize-y font-mono"
          />
          {form.stepsText.trim() && (
            <p className="text-xs text-mtg-muted">
              {form.stepsText.split('\n').filter(s => s.trim()).length} steg
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pb-6">
        <button
          onClick={handleSave}
          className="bg-mtg-gold text-mtg-bg text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all"
        >
          Lagre scenario
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-mtg-muted hover:text-mtg-text px-4 py-2.5 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
