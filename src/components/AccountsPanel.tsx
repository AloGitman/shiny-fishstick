'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './AccountsPanel.module.css'

type Account = {
  gameId: string
  isAdmin: boolean
  mustChangePassword: boolean
  createdAt: number
}

type Props = {
  token: string
  currentGameId: string
}

export default function AccountsPanel({ token, currentGameId }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [newGameId, setNewGameId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accounts', { headers })
      if (res.ok) setAccounts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ gameId: newGameId, password: newPassword, isAdmin: newIsAdmin }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error ?? 'Failed'); return }
      setNewGameId(''); setNewPassword(''); setNewIsAdmin(false)
      await load()
    } catch {
      setCreateError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(gameId: string) {
    if (!confirm(`Delete account ${gameId}?`)) return
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ gameId }),
    })
    await load()
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Account Management</h2>

      <div className={styles.createCard}>
        <h3 className={styles.subHeading}>Create Account</h3>
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            className={styles.input}
            placeholder="Game ID"
            value={newGameId}
            onChange={e => setNewGameId(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={newIsAdmin}
              onChange={e => setNewIsAdmin(e.target.checked)}
            />
            Admin
          </label>
          {createError && <p className={styles.error}>{createError}</p>}
          <button className={styles.createBtn} type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <h3 className={styles.subHeading}>All Accounts</h3>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Role</th>
                <th>Must Change PW</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.gameId} className={a.gameId === currentGameId ? styles.currentRow : ''}>
                  <td>{a.gameId}</td>
                  <td>{a.isAdmin ? <span className={styles.adminBadge}>Admin</span> : 'User'}</td>
                  <td>{a.mustChangePassword ? '⚠️ Yes' : 'No'}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    {a.gameId !== '0' && a.gameId !== currentGameId && (
                      <button className={styles.deleteBtn} onClick={() => handleDelete(a.gameId)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
