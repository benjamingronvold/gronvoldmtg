import { useState, useEffect, useRef } from 'react'

const memoryCache = {}

export function useScryfall(cardName) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!cardName) return

    if (memoryCache[cardName]) {
      setImageUrl(memoryCache[cardName])
      return
    }

    setLoading(true)
    setError(false)

    const stored = (() => {
      try {
        const cache = JSON.parse(localStorage.getItem('ftl_scryfall_cache') || '{}')
        return cache[cardName] || null
      } catch { return null }
    })()

    if (stored) {
      memoryCache[cardName] = stored
      setImageUrl(stored)
      setLoading(false)
      return
    }

    const encodedName = encodeURIComponent(cardName)
    // First get the card JSON to get the image URI
    fetch(`https://api.scryfall.com/cards/named?exact=${encodedName}`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(data => {
        const url = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal
        if (!url) throw new Error('no image')
        memoryCache[cardName] = url
        try {
          const cache = JSON.parse(localStorage.getItem('ftl_scryfall_cache') || '{}')
          cache[cardName] = url
          localStorage.setItem('ftl_scryfall_cache', JSON.stringify(cache))
        } catch {}
        setImageUrl(url)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [cardName])

  return { imageUrl, loading, error }
}

export function useScryfallAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setSuggestions(data.data?.slice(0, 8) || []))
        .catch(() => setSuggestions([]))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return suggestions
}
