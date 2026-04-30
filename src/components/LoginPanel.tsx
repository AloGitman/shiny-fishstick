'use client'

import { useState } from 'react'
import type { Session } from '@/app/page'
import styles from './LoginPanel.module.css'

export default function LoginPanel({ onLogin }: { onLogin: (s: Session) => void }) {
  const [gameId, setGameId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, password }),
      })
      const text = await res.text()
      let data: Record<string, string> = {}
      try { data = JSON.parse(text) } catch { data = { error: `Server returned: ${text || res.status}` } }
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      onLogin(data as unknown as Session)
    } catch (e: unknown) {
      setError('Network error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📊</span>
          <h1 className={styles.title}>Exist Count</h1>
          <p className={styles.subtitle}>Steal a Brainrot — Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Game ID</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 0"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
