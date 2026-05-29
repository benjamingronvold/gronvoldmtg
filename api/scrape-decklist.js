export const config = { runtime: 'edge' }

const ARCHETYPE_MAP = {
  'amulet': 'Amulet Titan',
  'titan': 'Amulet Titan',
  'boros energy': 'Boros Energy',
  'energy': 'Boros Energy',
  'dimir frog': 'Dimir Frog',
  'frog': 'Dimir Frog',
  'living end': 'Living End',
  'murktide': 'Murktide Regent',
  'yawgmoth': 'Golgari Yawgmoth',
  'prowess': 'Izzet Prowess',
  'tron': 'Mono Green Tron',
  'eldrazi tron': 'Eldrazi Tron',
  'rhinos': 'Rhinos',
  'crashing footfalls': 'Rhinos',
  'jund': 'Jund Sagavan',
  'sagavan': 'Jund Sagavan',
  'burn': 'Burn',
  'affinity': 'Affinity',
  'hammer': 'Hammertime',
  'hammertime': 'Hammertime',
  'control': 'UW Control',
  'omnath': 'Four-Color Omnath',
  'domain': 'Domain Zoo',
  'creativity': 'Creativity',
  'mill': 'Mill',
  'storm': 'Storm',
  'belcher': 'Belcher',
  'shadow': 'Death\'s Shadow',
  'hardened scales': 'Hardened Scales',
  'merfolk': 'Merfolk',
}

function inferArchetype(deckName) {
  const lower = deckName.toLowerCase()
  for (const [key, value] of Object.entries(ARCHETYPE_MAP)) {
    if (lower.includes(key)) return value
  }
  return null
}

async function fetchMoxfield(moxfieldUsername) {
  const url = `https://api.moxfield.com/v2/users/${encodeURIComponent(moxfieldUsername)}/decks?pageSize=10&sortType=updated&sortDirection=Descending`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MTGApp/1.0' },
  })
  if (!res.ok) return null

  const data = await res.json()
  const decks = data.data ?? []

  const modernDeck = decks.find(d =>
    d.format?.toLowerCase() === 'modern' ||
    d.name?.toLowerCase().includes('modern')
  ) ?? decks[0]

  if (!modernDeck) return null

  return {
    deckName: modernDeck.name,
    archetype: inferArchetype(modernDeck.name),
    decklistUrl: `https://www.moxfield.com/decks/${modernDeck.publicId}`,
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { moxfieldUsername } = body
  if (!moxfieldUsername) {
    return new Response(JSON.stringify({ error: 'moxfieldUsername required' }), { status: 400 })
  }

  const result = await fetchMoxfield(moxfieldUsername)

  if (!result) {
    return new Response(
      JSON.stringify({ error: 'No decks found', archetype: null, decklistUrl: null }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
}
