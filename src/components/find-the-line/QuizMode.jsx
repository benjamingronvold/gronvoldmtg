import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import BoardState from './BoardState.jsx'
import StepFeedback from './StepFeedback.jsx'
import { evaluateStep } from '../../hooks/useEvaluator.js'
import { useStorage } from '../../hooks/useStorage.js'

export default function QuizMode({ scenario, onBack }) {
  const { saveAttempt, saveScenario } = useStorage()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [stepResults, setStepResults] = useState([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [outcome, setOutcome] = useState('in-progress')
  const [attemptId] = useState(() => uuidv4())
  const [hintText, setHintText] = useState('')

  const totalSteps = scenario.solution.steps.length
  const solved = outcome === 'solved'
  const gaveUp = outcome === 'gave-up'
  const done = solved || gaveUp

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userInput.trim() || isEvaluating || done) return

    setIsEvaluating(true)
    setHintText('')

    const previousSteps = stepResults.map(r => r.userInput)
    const result = await evaluateStep({
      scenario,
      stepNumber: currentStepIndex + 1,
      userInput: userInput.trim(),
      previousSteps,
      mode: 'evaluate',
    })

    const stepResult = {
      stepNumber: currentStepIndex + 1,
      userInput: userInput.trim(),
      evaluation: result.evaluation,
      aiFeedback: result.feedback,
      hint: result.hint || '',
      timestamp: new Date().toISOString(),
    }

    const newResults = [...stepResults, stepResult]
    setStepResults(newResults)
    setUserInput('')

    if (result.evaluation === 'correct') {
      const nextIndex = currentStepIndex + 1
      if (nextIndex >= totalSteps) {
        setOutcome('solved')
        persistAttempt(newResults, 'solved')
        updateScenarioStats(true)
      } else {
        setCurrentStepIndex(nextIndex)
      }
    }

    setIsEvaluating(false)
  }

  async function handleHint() {
    if (isEvaluating || done) return
    setIsEvaluating(true)
    const result = await evaluateStep({
      scenario,
      stepNumber: currentStepIndex + 1,
      userInput: '',
      previousSteps: stepResults.map(r => r.userInput),
      mode: 'hint',
    })
    setHintText(result.hint || result.feedback)
    setHintsUsed(h => h + 1)
    setIsEvaluating(false)
  }

  function handleShowSolution() {
    setShowSolution(true)
    setOutcome('gave-up')
    persistAttempt(stepResults, 'gave-up')
    updateScenarioStats(false)
  }

  function persistAttempt(results, finalOutcome) {
    saveAttempt({
      id: attemptId,
      scenarioId: scenario.id,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      outcome: finalOutcome,
      stepsAttempted: results,
    })
  }

  function updateScenarioStats(wasSolved) {
    const updated = {
      ...scenario,
      metadata: {
        ...scenario.metadata,
        timesAttempted: (scenario.metadata.timesAttempted || 0) + 1,
        timesSolved: (scenario.metadata.timesSolved || 0) + (wasSolved ? 1 : 0),
        updatedAt: new Date().toISOString(),
      },
    }
    saveScenario(updated)
  }

  const progressPct = totalSteps > 0 ? (currentStepIndex / totalSteps) * 100 : 0

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{scenario.name}</h1>
        <p className="text-gray-400 text-sm mt-1">{scenario.description}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Step {Math.min(currentStepIndex + 1, totalSteps)} of {solved ? totalSteps : '?'}</span>
          <span>{hintsUsed > 0 ? `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used` : ''}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${solved ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${solved ? 100 : progressPct}%` }}
          />
        </div>
      </div>

      {/* Board state */}
      <BoardState boardstate={scenario.boardstate} opponent={scenario.opponent} />

      {/* Win condition */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal: </span>
        <span className="text-sm text-gray-300">{scenario.solution.winCondition}</span>
      </div>

      {/* Opponent */}
      {scenario.opponent?.enabled && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Opponent note: </span>
          <span className="text-sm text-amber-200">{scenario.opponent.note}</span>
        </div>
      )}

      {/* Step results */}
      {stepResults.length > 0 && (
        <div className="space-y-2">
          {stepResults.map((r, i) => (
            <StepFeedback
              key={i}
              stepNumber={r.stepNumber}
              userInput={r.userInput}
              evaluation={r.evaluation}
              feedback={r.aiFeedback}
            />
          ))}
        </div>
      )}

      {/* Hint text */}
      {hintText && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-400 mb-1">💡 Hint for Step {currentStepIndex + 1}</p>
          <p className="text-sm text-blue-200">{hintText}</p>
        </div>
      )}

      {/* Solved */}
      {solved && (
        <div className="bg-green-900/40 border border-green-600 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-green-300 font-bold text-xl">Line found!</p>
          <p className="text-green-400 text-sm mt-1">
            Completed in {stepResults.length} steps{hintsUsed > 0 ? ` with ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''}.
          </p>
          <button onClick={onBack} className="mt-4 bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition-colors">
            Back to Scenarios
          </button>
        </div>
      )}

      {/* Solution reveal */}
      {showSolution && (
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-5">
          <p className="font-semibold text-gray-300 mb-3">Full Solution</p>
          {scenario.solution.notes && (
            <p className="text-sm text-yellow-300 mb-3 italic">Key insight: {scenario.solution.notes}</p>
          )}
          <ol className="space-y-2">
            {scenario.solution.steps.map((step) => (
              <li key={step.step} className="flex gap-3 text-sm">
                <span className="text-gray-500 font-mono w-6 flex-shrink-0">{step.step}.</span>
                <div>
                  <span className="text-gray-200">{step.action}</span>
                  {step.floating && <span className="text-gray-500 ml-2">({step.floating})</span>}
                  {step.notes && <p className="text-gray-500 text-xs mt-0.5">{step.notes}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Input form */}
      {!done && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Step {currentStepIndex + 1} — What do you do?
          </label>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
            placeholder="Describe your play... (Enter to submit)"
            rows={3}
            disabled={isEvaluating}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isEvaluating || !userInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              {isEvaluating ? 'Evaluating...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleHint}
              disabled={isEvaluating}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              💡 Hint
            </button>
            <button
              type="button"
              onClick={handleShowSolution}
              disabled={isEvaluating}
              className="ml-auto bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Show Solution
            </button>
          </div>
        </form>
      )}

      {gaveUp && !solved && (
        <button onClick={onBack} className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg transition-colors">
          Back to Scenarios
        </button>
      )}
    </div>
  )
}
