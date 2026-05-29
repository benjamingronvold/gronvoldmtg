import { buildSystemPrompt, buildUserMessage } from '../utils/evaluator-prompt.js'

export async function evaluateStep({ scenario, stepNumber, userInput, previousSteps, mode }) {
  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: buildSystemPrompt(scenario, stepNumber, mode),
        messages: [{
          role: 'user',
          content: buildUserMessage(stepNumber, userInput, previousSteps, mode),
        }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error ${response.status}`)
    }

    const raw = await response.json()

    if (mode === 'hint') {
      const text = typeof raw === 'string' ? raw : (raw.feedback ?? raw.hint ?? '')
      return { evaluation: 'hint', feedback: text, hint: text }
    }

    return raw
  } catch (err) {
    return {
      evaluation: 'partial',
      feedback: `Evaluation unavailable — ${err.message}.`,
      hint: '',
    }
  }
}
