import { SignJWT, jwtVerify } from 'jose'
import { store } from './kv'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)

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

// --- Password hashing using Web Crypto (no native modules needed) ---

async function sha256(data: string): Promise<ArrayBuffer> {
  const encoded = new TextEncoder().encode(data)
  return crypto.subtle.digest('SHA-256', encoded)
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function pbkdf2Hash(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 },
    keyMaterial,
    256
  )
  return bufToHex(bits)
}

async function randomSalt(): Promise<string> {
  const buf = crypto.getRandomValues(new Uint8Array(16))
  return bufToHex(buf.buffer)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await randomSalt()
  const hash = await pbkdf2Hash(password, salt)
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHash] = stored.split(':')
  if (!salt || !expectedHash) return false
  const hash = await pbkdf2Hash(password, salt)
  return hash === expectedHash
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
