import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).then(() => {
      navigate('/dashboard', { replace: true })
    }).catch(() => {
      navigate('/login', { replace: true })
    })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-mtg-muted animate-pulse font-display">Signing you in…</p>
    </div>
  )
}
