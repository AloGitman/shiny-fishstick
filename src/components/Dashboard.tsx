'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@/app/page'
import AnimalCard from './AnimalCard'
import AccountsPanel from './AccountsPanel'
import ChangePasswordModal from './ChangePasswordModal'
import styles from './Dashboard.module.css'
import type { AnimalStats } from '@/lib/stats'

type Props = {
  session: Session
  onLogout: () => void
  onSessionUpdate: (s: Session) => void
}

export default function Dashboard({ session, onLogout, onSessionUpdate }: Props) {
  const [animals, setAnimals] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [stats, setStats] = useState<(AnimalStats & { imageUrl?: string }) | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [tab, setTab] = useState<'lookup' | 'accounts'>('lookup')
  const [showChangePw, setShowChangePw] = useState(session.mustChangePassword)

  const headers = { Authorization: `Bearer ${session.token}` }

  const loadAnimals = useCallback(async () => {
    try {
      const res = await fetch('/api/stats', { headers })
      if (res.ok) {
        const data = await res.json()
        setAnimals(data.animals ?? [])
      }
    } catch {}
  }, [session.token])

  useEffect(() => { loadAnimals() }, [loadAnimals])

  async function loadStats(name: string) {
    setSelected(name)
    setStats(null)
    setStatsError('')
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/stats/${encodeURIComponent(name)}`, { headers })
      const data = await res.json()
      if (!res.ok) { setStatsError(data.error ?? 'Failed to load'); return }
      setStats(data)
    } catch {
      setStatsError('Network error')
    } finally {
      setStatsLoading(false)
    }
  }

  const filtered = animals.filter(a => a.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.layout}>
      {showChangePw && (
        <ChangePasswordModal
          token={session.token}
          onDone={() => {
            setShowChangePw(false)
            onSessionUpdate({ ...session, mustChangePassword: false })
          }}
        />
      )}

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>📊</span>
          <span className={styles.sidebarTitle}>Exist Count</span>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${tab === 'lookup' ? styles.navActive : ''}`}
            onClick={() => setTab('lookup')}
          >
            🔍 Animal Lookup
          </button>
          {session.isAdmin && (
            <button
              className={`${styles.navBtn} ${tab === 'accounts' ? styles.navActive : ''}`}
              onClick={() => setTab('accounts')}
            >
              👥 Accounts
            </button>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.gameId}>ID: {session.gameId}</span>
          <button className={styles.logoutBtn} onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className={styles.main}>
        {tab === 'lookup' && (
          <div className={styles.lookupLayout}>
            <div className={styles.animalList}>
              <div className={styles.searchWrap}>
                <input
                  className={styles.searchInput}
                  placeholder="Search animals…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className={styles.animalItems}>
                {filtered.length === 0 && (
                  <p className={styles.empty}>
                    {animals.length === 0
                      ? 'No data yet. The game will push data once ExistCountService is running.'
                      : 'No matches.'}
                  </p>
                )}
                {filtered.map(name => (
                  <button
                    key={name}
                    className={`${styles.animalItem} ${selected === name ? styles.animalItemActive : ''}`}
                    onClick={() => loadStats(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.cardArea}>
              {!selected && (
                <div className={styles.placeholder}>
                  <span>👈</span>
                  <p>Select an animal to view statistics</p>
                </div>
              )}
              {selected && statsLoading && (
                <div className={styles.placeholder}><p>Loading…</p></div>
              )}
              {selected && statsError && (
                <div className={styles.placeholder}><p className={styles.errText}>{statsError}</p></div>
              )}
              {selected && stats && !statsLoading && (
                <AnimalCard stats={stats} onClose={() => { setSelected(null); setStats(null) }} />
              )}
            </div>
          </div>
        )}

        {tab === 'accounts' && session.isAdmin && (
          <AccountsPanel token={session.token} currentGameId={session.gameId} />
        )}
      </main>
    </div>
  )
}
