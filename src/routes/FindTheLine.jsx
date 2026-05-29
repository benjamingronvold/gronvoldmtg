import { useState } from 'react'
import ScenarioList from '../components/find-the-line/ScenarioList.jsx'
import QuizMode from '../components/find-the-line/QuizMode.jsx'
import ScenarioEditor from '../components/find-the-line/ScenarioEditor.jsx'
import { useStorage } from '../hooks/useStorage.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function FindTheLine() {
  const [view, setView] = useState('list')
  const [activeScenario, setActiveScenario] = useState(null)
  const [editingScenario, setEditingScenario] = useState(null)
  const { scenarios } = useStorage()
  const { isAdmin } = useAuth()

  function handlePlay(scenario) {
    setActiveScenario(scenario)
    setView('quiz')
  }

  function handleEdit(scenario) {
    if (!isAdmin) return
    setEditingScenario(scenario)
    setView('editor')
  }

  function handleNew() {
    if (!isAdmin) return
    setEditingScenario(null)
    setView('editor')
  }

  function handleBack() {
    setView('list')
    setActiveScenario(null)
    setEditingScenario(null)
  }

  return (
    <div>
      <header className="border-b border-mtg-border bg-mtg-bg px-6 py-3 flex items-center justify-between">
        <button onClick={handleBack} className="font-display text-mtg-gold hover:brightness-110 transition">
          🎯 Find the Line
        </button>
        {view === 'list' && isAdmin && (
          <button
            onClick={handleNew}
            className="bg-mtg-gold/20 hover:bg-mtg-gold/30 border border-mtg-gold/40 text-mtg-gold text-sm px-3 py-1.5 rounded transition-colors"
          >
            + New Scenario
          </button>
        )}
        {view !== 'list' && (
          <button onClick={handleBack} className="text-sm text-mtg-muted hover:text-mtg-text transition-colors">
            ← Back
          </button>
        )}
      </header>

      <main>
        {view === 'list' && (
          <ScenarioList
            scenarios={scenarios}
            onPlay={handlePlay}
            onEdit={isAdmin ? handleEdit : undefined}
          />
        )}
        {view === 'quiz' && activeScenario && (
          <QuizMode scenario={activeScenario} onBack={handleBack} />
        )}
        {view === 'editor' && isAdmin && (
          <ScenarioEditor
            scenario={editingScenario}
            onSave={handleBack}
            onCancel={handleBack}
          />
        )}
      </main>
    </div>
  )
}
