'use client'

import { useState, useEffect } from 'react'
import LoginPanel from '@/components/LoginPanel'
import Dashboard from '@/components/Dashboard'

export type Session = {
  token: string
  gameId: string
  isAdmin: boolean
  mustChangePassword: boolean
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('session')
    if (stored) {
      try { setSession(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  function handleLogin(s: Session) {
    localStorage.setItem('session', JSON.stringify(s))
    setSession(s)
  }

  function handleLogout() {
    localStorage.removeItem('session')
    setSession(null)
  }

  if (loading) return null

  if (!session) return <LoginPanel onLogin={handleLogin} />

  return (
    <Dashboard
      session={session}
      onLogout={handleLogout}
      onSessionUpdate={(s) => {
        localStorage.setItem('session', JSON.stringify(s))
        setSession(s)
      }}
    />
  )
}
