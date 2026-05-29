import { useState, useEffect } from 'react'
import { SEED_SCENARIOS } from '../data/scenarios.js'

const KEYS = {
  SCENARIOS: 'ftl_scenarios',
  ATTEMPTS: 'ftl_attempts',
  SCRYFALL_CACHE: 'ftl_scryfall_cache',
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // trim oldest 10 attempts and retry
      if (key === KEYS.ATTEMPTS) {
        const current = safeGet(KEYS.ATTEMPTS, [])
        localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(current.slice(10)))
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch {
          return false
        }
      }
    }
    return false
  }
}

export function useStorage() {
  const [scenarios, setScenarios] = useState(() => {
    const stored = safeGet(KEYS.SCENARIOS, [])
    // Remove any old seed scenarios (id starts with 'seed-')
    const userScenarios = stored.filter(s => !s.id.startsWith('seed-'))
    if (userScenarios.length !== stored.length) {
      safeSet(KEYS.SCENARIOS, userScenarios)
    }
    if (userScenarios.length === 0 && SEED_SCENARIOS.length > 0) {
      safeSet(KEYS.SCENARIOS, SEED_SCENARIOS)
      return SEED_SCENARIOS
    }
    return userScenarios
  })

  const [attempts, setAttempts] = useState(() => safeGet(KEYS.ATTEMPTS, []))

  function saveScenario(scenario) {
    setScenarios(prev => {
      const exists = prev.find(s => s.id === scenario.id)
      const updated = exists
        ? prev.map(s => s.id === scenario.id ? scenario : s)
        : [...prev, scenario]
      safeSet(KEYS.SCENARIOS, updated)
      return updated
    })
  }

  function deleteScenario(id) {
    setScenarios(prev => {
      const updated = prev.filter(s => s.id !== id)
      safeSet(KEYS.SCENARIOS, updated)
      return updated
    })
  }

  function saveAttempt(attempt) {
    setAttempts(prev => {
      const exists = prev.find(a => a.id === attempt.id)
      let updated
      if (exists) {
        updated = prev.map(a => a.id === attempt.id ? attempt : a)
      } else {
        updated = [...prev, attempt]
        if (updated.length > 50) updated = updated.slice(-50)
      }
      safeSet(KEYS.ATTEMPTS, updated)
      return updated
    })
  }

  function getAttemptsForScenario(scenarioId) {
    return attempts.filter(a => a.scenarioId === scenarioId)
  }

  function getScryfallCache() {
    return safeGet(KEYS.SCRYFALL_CACHE, {})
  }

  function setScryfallCache(cache) {
    safeSet(KEYS.SCRYFALL_CACHE, cache)
  }

  return {
    scenarios,
    attempts,
    saveScenario,
    deleteScenario,
    saveAttempt,
    getAttemptsForScenario,
    getScryfallCache,
    setScryfallCache,
  }
}
