export function buildSystemPrompt(scenario, stepNumber, mode) {
  const solutionText = scenario.solution.steps
    .map(s => `Step ${s.step}: ${s.action}${s.floating ? ` (${s.floating})` : ''}${s.notes ? ` — ${s.notes}` : ''}`)
    .join('\n')

  const boardText = [
    `Battlefield: ${scenario.boardstate.battlefield.map(c => `${c.name} x${c.count}${c.tapped ? ' (tapped)' : ''}`).join(', ')}`,
    `Hand: ${scenario.boardstate.hand.map(c => c.name).join(', ') || 'empty'}`,
    `Graveyard: ${scenario.boardstate.graveyard.map(c => c.name).join(', ') || 'empty'}`,
    `Floating mana: ${formatMana(scenario.boardstate.floating)}`,
  ].join('\n')

  if (mode === 'hint') {
    return `You are an Amulet Titan expert giving a hint to a student stuck on step ${stepNumber}.

Boardstate:
${boardText}

The correct step ${stepNumber} is:
"${scenario.solution.steps[stepNumber - 1]?.action}"

Give a helpful hint that points them in the right direction WITHOUT revealing the exact answer.
Focus on the key decision or resource they might be overlooking.
Keep it to 1-2 sentences.
Respond in plain text, not JSON.`
  }

  return `You are an expert Amulet Titan Magic: The Gathering player evaluating a student's play sequence.

## Scenario: ${scenario.name}
## Goal: ${scenario.solution.winCondition}

## Starting Boardstate
${boardText}

${scenario.opponent.enabled ? `## Opponent Constraint\n${scenario.opponent.note}\n` : ''}
## Correct Solution (NEVER reveal this directly to the student)
${solutionText}

${scenario.solution.notes ? `## Additional Context\n${scenario.solution.notes}\n` : ''}
## Your job
Evaluate whether the student's input for step ${stepNumber} is:
- "correct" — matches the intent of the solution step (exact wording not required)
- "partial" — on the right track but missing something important or in wrong order
- "incorrect" — wrong card, wrong target, or fundamentally different play

Rules:
- Accept paraphrasing. "Search for Mirrorpool and a bounceland" = "Find Mirrorpool + SGC with Titan trigger" = correct.
- Focus on the KEY action, not every detail.
- If partial or incorrect, explain WHY without revealing the next step.
- Be concise — 2 sentences max for feedback.
- Never say "The correct answer is..."

Respond ONLY with valid JSON:
{ "evaluation": "correct" | "partial" | "incorrect", "feedback": "...", "hint": "" }`
}

export function buildUserMessage(stepNumber, userInput, previousSteps, mode) {
  if (mode === 'hint') return `I'm stuck on step ${stepNumber}.`

  const prev = previousSteps.length > 0
    ? `Previous steps completed:\n${previousSteps.map((s, i) => `Step ${i + 1}: ${s}`).join('\n')}\n\n`
    : ''

  return `${prev}My action for Step ${stepNumber}: ${userInput}`
}

function formatMana(pool) {
  if (!pool) return '0'
  const parts = []
  if (pool.W) parts.push(`${pool.W}W`)
  if (pool.U) parts.push(`${pool.U}U`)
  if (pool.B) parts.push(`${pool.B}B`)
  if (pool.R) parts.push(`${pool.R}R`)
  if (pool.G) parts.push(`${pool.G}G`)
  if (pool.colorless) parts.push(`${pool.colorless}`)
  return parts.join(' ') || '0'
}
