import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'

export function useMatches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMatches = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setMatches(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  async function addMatch(matchData) {
    const { data, error } = await supabase
      .from('matches')
      .insert({ ...matchData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setMatches(prev => [data, ...prev])
    return data
  }

  async function deleteMatch(id) {
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) throw error
    setMatches(prev => prev.filter(m => m.id !== id))
  }

  return { matches, loading, error, addMatch, deleteMatch, refresh: fetchMatches }
}
