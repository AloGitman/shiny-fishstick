import { store } from './kv'

export type OwnerEntry = {
  userId: string
  username: string
  displayName: string
  avatarUrl: string
  count: number
  totalGeneration: number
}

export type MutationStat = {
  name: string
  count: number
  percentage: number
}

export type TraitStat = {
  name: string
  count: number
  percentage: number
}

export type AnimalStats = {
  animalName: string
  totalExists: number
  avgRebirth: number
  avgCoins: number
  baseGenPerSecond: number
  totalGenPerSecond: number
  mutations: MutationStat[]
  traits: TraitStat[]
  topOwner: OwnerEntry | null
  lastUpdated: number
}

const STATS_PREFIX = 'stats:'

export async function getAnimalStats(animalName: string): Promise<AnimalStats | null> {
  return (await store.get(`${STATS_PREFIX}${animalName}`)) as AnimalStats | null
}

export async function saveAnimalStats(stats: AnimalStats): Promise<void> {
  await store.set(`${STATS_PREFIX}${stats.animalName}`, stats)
}

export async function listAnimalNames(): Promise<string[]> {
  const keys = await store.keys(`${STATS_PREFIX}*`)
  return keys.map(k => k.replace(STATS_PREFIX, ''))
}

// Called by the game's ExistCountService via POST /api/report
export async function processReport(payload: AnimalStats): Promise<void> {
  await saveAnimalStats({
    ...payload,
    lastUpdated: Date.now(),
  })
}
