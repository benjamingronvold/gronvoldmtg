import { useState } from 'react'
import ScenarioList from '../components/find-the-line/ScenarioList.jsx'
import QuizMode from '../components/find-the-line/QuizMode.jsx'
import ScenarioEditor from '../components/find-the-line/ScenarioEditor.jsx'
import QuickCreate from '../components/find-the-line/QuickCreate.jsx'
import { useStorage } from '../hooks/useStorage.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function FindTheLine() {
  const [view, setView] = useState('list')
  const [activeScenario, setActiveScenario] = useState(null)
  const [editingScenario, setEditingScenario] = useState(null)
  const { scenarios, saveScenario, deleteScenario } = useStorage()
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
    setView('quick-create')
  }

  function handleFullEditor() {
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
          Find the Line
        </button>

        <div className="flex items-center gap-2">
          {view === 'list' && isAdmin && (
            <button
              onClick={handleNew}
              className="bg-mtg-gold/20 hover:bg-mtg-gold/30 border border-mtg-gold/40 text-mtg-gold text-sm px-3 py-1.5 rounded transition-colors"
            >
              + Nytt scenario
            </button>
          )}
          {view === 'quick-create' && isAdmin && (
            <button
              onClick={handleFullEditor}
              className="text-sm text-mtg-muted hover:text-mtg-text border border-mtg-border rounded px-3 py-1.5 transition-colors"
            >
              Full editor
            </button>
          )}
          {view !== 'list' && (
            <button onClick={handleBack} className="text-sm text-mtg-muted hover:text-mtg-text transition-colors">
              ← Tilbake
            </button>
          )}
        </div>
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
            saveScenario={saveScenario}
          />
        )}
        {view === 'quick-create' && isAdmin && (
          <QuickCreate
            onSave={handleBack}
            onCancel={handleBack}
            saveScenario={saveScenario}
          />
        )}
      </main>
    </div>
  )
}
