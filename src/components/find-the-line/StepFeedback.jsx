const STYLES = {
  correct: 'border-green-600 bg-green-900/30 text-green-300',
  partial: 'border-yellow-600 bg-yellow-900/30 text-yellow-300',
  incorrect: 'border-red-600 bg-red-900/30 text-red-300',
  hint: 'border-blue-600 bg-blue-900/30 text-blue-300',
}

const ICONS = {
  correct: '✓',
  partial: '~',
  incorrect: '✗',
  hint: '💡',
}

export default function StepFeedback({ stepNumber, userInput, evaluation, feedback }) {
  if (!evaluation) return null

  return (
    <div className={`rounded-lg border p-3 ${STYLES[evaluation] || STYLES.partial}`}>
      <div className="flex items-start gap-2">
        <span className="font-bold text-lg leading-tight">{ICONS[evaluation] || '?'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">Step {stepNumber}: "{userInput}"</p>
          <p className="text-sm">{feedback}</p>
        </div>
      </div>
    </div>
  )
}
