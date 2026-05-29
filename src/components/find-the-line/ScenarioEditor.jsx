import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '../../hooks/useStorage.js'
import { useScryfallAutocomplete } from '../../hooks/useScryfall.js'

function CardEntry({ card, onChange, onRemove }) {
  const suggestions = useScryfallAutocomplete(card.name)
  const [showSuggestions, setShowSuggestions] = useState(false)

  return (
    <div className="flex gap-2 items-center relative">
      <div className="flex-1 relative">
        <input
          value={card.name}
          onChange={e => { onChange({ ...card, name: e.target.value }); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Card name"
          className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 left-0 top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map(name => (
              <li
                key={name}
                onMouseDown={() => { onChange({ ...card, name }); setShowSuggestions(false) }}
                className="px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        type="number"
        min={1}
        max={4}
        value={card.count}
        onChange={e => onChange({ ...card, count: parseInt(e.target.value) || 1 })}
        className="w-16 bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1.5 focus:outline-none"
        title="Count"
      />
      <button onClick={onRemove} className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
    </div>
  )
}

function StepEntry({ step, onChange, onRemove, onMoveUp, onMoveDown, index, total }) {
  return (
    <div className="bg-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-sm font-mono w-6">{index + 1}.</span>
        <div className="flex gap-1 ml-auto">
          <button onClick={onMoveUp} disabled={index === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 px-1">↑</button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 px-1">↓</button>
          <button onClick={onRemove} className="text-gray-500 hover:text-red-400 px-1">✕</button>
        </div>
      </div>
      <input
        value={step.action}
        onChange={e => onChange({ ...step, action: e.target.value })}
        placeholder="Action description"
        className="w-full bg-gray-600 border border-gray-500 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          value={step.floating || ''}
          onChange={e => onChange({ ...step, floating: e.target.value })}
          placeholder="Floating mana (e.g. 2 floating)"
          className="flex-1 bg-gray-600 border border-gray-500 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none"
        />
        <input
          value={step.notes || ''}
          onChange={e => onChange({ ...step, notes: e.target.value })}
          placeholder="Notes"
          className="flex-1 bg-gray-600 border border-gray-500 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none"
        />
      </div>
    </div>
  )
}

export default function ScenarioEditor({ scenario, onSave, onCancel }) {
  const { saveScenario } = useStorage()
  const [errors, setErrors] = useState([])

  const [form, setForm] = useState(() => scenario ? { ...scenario } : {
    id: uuidv4(),
    name: '',
    description: '',
    tags: [],
    difficulty: 'intermediate',
    source: 'custom',
    boardstate: {
      battlefield: [],
      hand: [],
      graveyard: [],
      floating: { W: 0, U: 0, B: 0, R: 0, G: 0, colorless: 0 },
      life: 20,
    },
    opponent: { enabled: false, note: '', deck: '' },
    solution: { winCondition: '', notes: '', steps: [] },
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), timesAttempted: 0, timesSolved: 0 },
  })

  function addCard(zone) {
    setForm(f => ({
      ...f,
      boardstate: { ...f.boardstate, [zone]: [...f.boardstate[zone], { name: '', count: 1, tapped: false }] }
    }))
  }

  function updateCard(zone, index, card) {
    setForm(f => ({
      ...f,
      boardstate: { ...f.boardstate, [zone]: f.boardstate[zone].map((c, i) => i === index ? card : c) }
    }))
  }

  function removeCard(zone, index) {
    setForm(f => ({
      ...f,
      boardstate: { ...f.boardstate, [zone]: f.boardstate[zone].filter((_, i) => i !== index) }
    }))
  }

  function addStep() {
    setForm(f => ({
      ...f,
      solution: { ...f.solution, steps: [...f.solution.steps, { step: f.solution.steps.length + 1, action: '', floating: '', notes: '' }] }
    }))
  }

  function updateStep(index, step) {
    setForm(f => ({
      ...f,
      solution: { ...f.solution, steps: f.solution.steps.map((s, i) => i === index ? step : s) }
    }))
  }

  function removeStep(index) {
    setForm(f => ({
      ...f,
      solution: {
        ...f.solution,
        steps: f.solution.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 }))
      }
    }))
  }

  function moveStep(index, dir) {
    setForm(f => {
      const steps = [...f.solution.steps]
      const target = index + dir
      if (target < 0 || target >= steps.length) return f;
      [steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...f, solution: { ...f.solution, steps: steps.map((s, i) => ({ ...s, step: i + 1 })) } }
    })
  }

  function handleSave() {
    const errs = []
    if (!form.name.trim()) errs.push('Name is required')
    if (form.solution.steps.length === 0) errs.push('At least one solution step is required')
    if (form.solution.steps.some(s => !s.action.trim())) errs.push('All steps must have an action')
    if (errs.length > 0) { setErrors(errs); return }

    saveScenario({ ...form, metadata: { ...form.metadata, updatedAt: new Date().toISOString() } })
    onSave()
  }

  const manaColors = ['W', 'U', 'B', 'R', 'G', 'colorless']

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-xl font-bold text-white">{scenario ? 'Edit Scenario' : 'New Scenario'}</h2>

      {errors.length > 0 && (
        <div className="bg-red-900/40 border border-red-600 rounded-lg p-3">
          {errors.map((e, i) => <p key={i} className="text-red-300 text-sm">• {e}</p>)}
        </div>
      )}

      {/* Basic info */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Info</h3>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Scenario name *" className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500" />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none" />
        <div className="flex gap-3">
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
          <input value={(form.tags || []).join(', ')} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} placeholder="Tags (comma separated)" className="flex-1 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none" />
        </div>
      </section>

      {/* Boardstate */}
      {['battlefield', 'hand', 'graveyard'].map(zone => (
        <section key={zone} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{zone}</h3>
          {form.boardstate[zone].map((card, i) => (
            <CardEntry key={i} card={card} onChange={c => updateCard(zone, i, c)} onRemove={() => removeCard(zone, i)} />
          ))}
          <button onClick={() => addCard(zone)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">+ Add card</button>
        </section>
      ))}

      {/* Floating mana */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Floating Mana</h3>
        <div className="flex gap-3 flex-wrap">
          {manaColors.map(color => (
            <div key={color} className="flex items-center gap-1">
              <label className="text-gray-400 text-sm">{color}</label>
              <input
                type="number"
                min={0}
                value={form.boardstate.floating[color] || 0}
                onChange={e => setForm(f => ({ ...f, boardstate: { ...f.boardstate, floating: { ...f.boardstate.floating, [color]: parseInt(e.target.value) || 0 } } }))}
                className="w-14 bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Opponent */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Opponent</h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.opponent.enabled} onChange={e => setForm(f => ({ ...f, opponent: { ...f.opponent, enabled: e.target.checked } }))} className="rounded" />
          Enable opponent constraint
        </label>
        {form.opponent.enabled && (
          <div className="flex gap-2">
            <input value={form.opponent.note} onChange={e => setForm(f => ({ ...f, opponent: { ...f.opponent, note: e.target.value } }))} placeholder="Opponent note (e.g. Counterspell on 2 mana)" className="flex-1 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none text-sm" />
            <input value={form.opponent.deck} onChange={e => setForm(f => ({ ...f, opponent: { ...f.opponent, deck: e.target.value } }))} placeholder="Deck name" className="w-40 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none text-sm" />
          </div>
        )}
      </section>

      {/* Solution */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Solution</h3>
        <input value={form.solution.winCondition} onChange={e => setForm(f => ({ ...f, solution: { ...f.solution, winCondition: e.target.value } }))} placeholder="Win condition (e.g. Infinite mana → Thassa's Oracle)" className="w-full bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none text-sm" />
        <input value={form.solution.notes} onChange={e => setForm(f => ({ ...f, solution: { ...f.solution, notes: e.target.value } }))} placeholder="Key insight / notes" className="w-full bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:outline-none text-sm" />
        <div className="space-y-2">
          {form.solution.steps.map((step, i) => (
            <StepEntry key={i} step={step} index={i} total={form.solution.steps.length} onChange={s => updateStep(i, s)} onRemove={() => removeStep(i)} onMoveUp={() => moveStep(i, -1)} onMoveDown={() => moveStep(i, 1)} />
          ))}
          <button onClick={addStep} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">+ Add step</button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button onClick={handleSave} className="bg-green-700 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
          Save Scenario
        </button>
        <button onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-2.5 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
