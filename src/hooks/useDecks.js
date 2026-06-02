import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'

export function useDecks() {
  const { user } = useAuth()
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchDecks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('user_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    setDecks(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDecks() }, [fetchDecks])

  async function addDeck({ name, format = 'Modern', notes = '' }) {
    const { data, error } = await supabase
      .from('user_decks')
      .insert({ name, format, notes, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setDecks(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function updateDeck(id, changes) {
    const { error } = await supabase.from('user_decks').update(changes).eq('id', id)
    if (error) throw error
    setDecks(prev => prev.map(d => d.id === id ? { ...d, ...changes } : d))
  }

  async function deleteDeck(id) {
    const { error } = await supabase.from('user_decks').delete().eq('id', id)
    if (error) throw error
    setDecks(prev => prev.filter(d => d.id !== id))
  }

  return { decks, loading, addDeck, updateDeck, deleteDeck, refresh: fetchDecks }
}
