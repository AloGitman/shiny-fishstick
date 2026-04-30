import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { store } from './kv'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)
const SALT_ROUNDS = 10

export type Account = {
  gameId: string
  passwordHash: string
  isAdmin: boolean
  mustChangePassword: boolean
  createdAt: number
}

const ACCOUNT_PREFIX = 'account:'

export async function getAccount(gameId: string): Promise<Account | null> {
  return (await store.get(`${ACCOUNT_PREFIX}${gameId}`)) as Account | null
}

export async function saveAccount(account: Account): Promise<void> {
  await store.set(`${ACCOUNT_PREFIX}${account.gameId}`, account)
}

export async function deleteAccount(gameId: string): Promise<void> {
  await store.del(`${ACCOUNT_PREFIX}${gameId}`)
}

export async function listAccounts(): Promise<Account[]> {
  const keys = await store.keys(`${ACCOUNT_PREFIX}*`)
  const accounts = await Promise.all(keys.map(k => store.get(k) as Promise<Account>))
  return accounts.filter(Boolean)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(gameId: string): Promise<string> {
  return new SignJWT({ gameId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ gameId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { gameId: payload.gameId as string }
  } catch {
    return null
  }
}

// Seed default admin on first run
export async function ensureDefaultAdmin(): Promise<void> {
  const existing = await getAccount('0')
  if (!existing) {
    const passwordHash = await hashPassword('admin')
    await saveAccount({
      gameId: '0',
      passwordHash,
      isAdmin: true,
      mustChangePassword: true,
      createdAt: Date.now(),
    })
  }
}
