import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Login() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true })
  }, [isLoggedIn, navigate])

  async function handleDiscordLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-mtg-card border border-mtg-border rounded-2xl p-8 text-center shadow-2xl">
          <h1 className="font-display text-2xl text-mtg-gold mb-2">Welcome</h1>
          <p className="text-mtg-muted text-sm mb-8">
            Sign in with Discord to access Match Tracker and team features.
          </p>

          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
              <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.7 37.7 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.6 4.9a.2.2 0 0 0-.1.1C1.6 18.1-.9 31-.3 43.7a.2.2 0 0 0 .1.2A58.8 58.8 0 0 0 17.5 52a.2.2 0 0 0 .3-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.3 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47.2 47.2 0 0 0 3.6 5.9.2.2 0 0 0 .3.1 58.6 58.6 0 0 0 17.7-8.2.2.2 0 0 0 .1-.2c.7-14.5-2.6-27.3-10.2-38.7a.2.2 0 0 0-.1-.1zM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.1 0-3.9 2.8-7.1 6.4-7.1 3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1 0-3.9 2.8-7.1 6.4-7.1 3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1z" fill="currentColor"/>
            </svg>
            Log in with Discord
          </button>

          <p className="mt-6 text-xs text-mtg-muted">
            Find the Line is available without signing in.
          </p>
        </div>
      </div>
    </div>
  )
}
