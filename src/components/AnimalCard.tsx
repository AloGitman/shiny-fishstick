'use client'

import type { AnimalStats } from '@/lib/stats'
import styles from './AnimalCard.module.css'

type Props = {
  stats: AnimalStats & { imageUrl?: string }
  onClose: () => void
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className={styles.barWrap}>
      <div className={styles.bar} style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1e18) return (n / 1e18).toFixed(1) + 'Qi'
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'Q'
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

const MUTATION_COLORS: Record<string, string> = {
  Gold: '#f5a623',
  Diamond: '#00bcd4',
  Rainbow: '#a855f7',
  Candy: '#ec4899',
  Divine: '#facc15',
}

const TRAIT_COLORS: Record<string, string> = {
  Fire: '#e53935',
  Sombrero: '#f9a825',
  Indonesia: '#43a047',
}

function mutColor(name: string) { return MUTATION_COLORS[name] ?? '#4a5568' }
function traitColor(name: string) { return TRAIT_COLORS[name] ?? '#4a5568' }

export default function AnimalCard({ stats, onClose }: Props) {
  const maxMut = Math.max(...stats.mutations.map(m => m.count), 1)
  const maxTrait = Math.max(...stats.traits.map(t => t.count), 1)

  return (
    <div className={styles.card}>
      <button className={styles.close} onClick={onClose}>✕</button>

      <h2 className={styles.title}>{stats.animalName}</h2>

      {stats.imageUrl && (
        <div className={styles.imgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stats.imageUrl} alt={stats.animalName} className={styles.img} />
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Exists</div>
          <div className={styles.statValue}>{stats.totalExists}</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Avg Rebirth</div>
          <div className={styles.statValue}>{stats.avgRebirth.toFixed(1)}</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Avg Coins</div>
          <div className={styles.statValue}>${fmt(stats.avgCoins)}</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Base Gen/s</div>
          <div className={`${styles.statValue} ${styles.green}`}>{fmt(stats.baseGenPerSecond)}</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Gen/s</div>
          <div className={`${styles.statValue} ${styles.blue}`}>{fmt(stats.totalGenPerSecond)}</div>
          <div className={styles.statSub}>~{fmt(stats.totalExists > 0 ? stats.totalGenPerSecond / stats.totalExists : 0)}/ea avg</div>
        </div>
      </div>

      {stats.topOwner && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>👑 Highest Value Owner</div>
          <div className={styles.ownerRow}>
            {stats.topOwner.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stats.topOwner.avatarUrl} alt={stats.topOwner.username} className={styles.avatar} />
            )}
            <div className={styles.ownerInfo}>
              <div className={styles.ownerDisplay}>{stats.topOwner.displayName}</div>
              <div className={styles.ownerUsername}>@{stats.topOwner.username}</div>
            </div>
            <div className={styles.ownerStats}>
              <div className={styles.ownerCount}>{stats.topOwner.count} owned</div>
              <div className={styles.ownerGen}>{fmt(stats.topOwner.totalGeneration)}/s</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Mutations &amp; Traits</div>

        {stats.mutations.length > 0 && (
          <>
            <div className={styles.subLabel}>Mutations</div>
            {stats.mutations.map(m => (
              <div key={m.name} className={styles.row}>
                <div className={styles.dot} style={{ background: mutColor(m.name) }} />
                <span className={styles.rowIcon}>✦</span>
                <span className={styles.rowName} style={{ color: mutColor(m.name) }}>{m.name}</span>
                <Bar pct={(m.count / maxMut) * 100} color={mutColor(m.name)} />
                <span className={styles.count}>{m.count} <span className={styles.pct}>({m.percentage.toFixed(1)}%)</span></span>
                <span className={styles.personIcon}>👤</span>
              </div>
            ))}
          </>
        )}

        {stats.traits.length > 0 && (
          <>
            <div className={styles.subLabel} style={{ marginTop: 12 }}>
              Traits <span className={styles.traitNote}>(showing top {Math.min(stats.traits.length, 10)} of {stats.traits.length})</span>
            </div>
            {stats.traits.slice(0, 10).map(t => (
              <div key={t.name} className={styles.row}>
                <div className={styles.dot} style={{ background: traitColor(t.name) }} />
                <span className={styles.rowIcon}>🔥</span>
                <span className={styles.rowName} style={{ color: traitColor(t.name) !== '#4a5568' ? traitColor(t.name) : 'var(--text)' }}>{t.name}</span>
                <Bar pct={(t.count / maxTrait) * 100} color={traitColor(t.name)} />
                <span className={styles.count}>{t.count} <span className={styles.pct}>({t.percentage.toFixed(1)}%)</span></span>
                <span className={styles.personIcon}>👤</span>
              </div>
            ))}
          </>
        )}

        {stats.mutations.length === 0 && stats.traits.length === 0 && (
          <p className={styles.noData}>No mutation or trait data yet.</p>
        )}
      </div>

      <div className={styles.updated}>
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
