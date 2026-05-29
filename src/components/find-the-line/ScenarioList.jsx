import { useState } from 'react'
import { useStorage } from '../../hooks/useStorage.js'

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-900 text-green-300',
  intermediate: 'bg-yellow-900 text-yellow-300',
  expert: 'bg-red-900 text-red-300',
}

export default function ScenarioList({ scenarios, onPlay, onEdit }) {
  const { deleteScenario, getAttemptsForScenario } = useStorage()
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterTag, setFilterTag] = useState('')

  const allTags = [...new Set(scenarios.flatMap(s => s.tags || []))]

  const filtered = scenarios.filter(s => {
    if (filterDifficulty && s.difficulty !== filterDifficulty) return false
    if (filterTag && !(s.tags || []).includes(filterTag)) return false
    return true
  })

  function handleDelete(id) {
    if (confirm('Delete this scenario?')) deleteScenario(id)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterDifficulty}
          onChange={e => setFilterDifficulty(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
        <select
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="">All tags</option>
          {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        {(filterDifficulty || filterTag) && (
          <button
            onClick={() => { setFilterDifficulty(''); setFilterTag('') }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No scenarios found</p>
          <p className="text-sm">Try adjusting your filters or add a new scenario.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(scenario => {
          const attempts = getAttemptsForScenario(scenario.id)
          const solved = attempts.filter(a => a.outcome === 'solved').length
          return (
            <div key={scenario.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-semibold text-white text-sm leading-tight">{scenario.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${DIFFICULTY_STYLES[scenario.difficulty] || DIFFICULTY_STYLES.intermediate}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{scenario.description}</p>
              </div>

              {scenario.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {scenario.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500">
                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} · {solved} solved
                · {scenario.solution.steps.length} steps
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => onPlay(scenario)}
                  className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-1.5 rounded-lg font-medium transition-colors"
                >
                  ▶ Play
                </button>
                <button
                  onClick={() => onEdit(scenario)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(scenario.id)}
                  className="bg-gray-700 hover:bg-red-900 text-gray-500 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
