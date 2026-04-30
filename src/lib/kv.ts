import { put, del, list } from '@vercel/blob'

const mem: Record<string, unknown> = {}
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN

function blobPath(key: string) {
  return `kv/${key.replace(/[^a-zA-Z0-9._\-:/]/g, '_')}.json`
}

async function blobRead(key: string): Promise<unknown> {
  try {
    const { blobs } = await list({ prefix: blobPath(key) })
    const found = blobs.find(b => b.pathname === blobPath(key))
    if (!found) return null
    const res = await fetch(found.url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function blobWrite(key: string, value: unknown): Promise<void> {
  await put(blobPath(key), JSON.stringify(value), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

async function blobDelete(key: string): Promise<void> {
  try {
    const { blobs } = await list({ prefix: blobPath(key) })
    const found = blobs.find(b => b.pathname === blobPath(key))
    if (found) await del(found.url)
  } catch {}
}

async function blobKeys(pattern: string): Promise<string[]> {
  const prefix = blobPath(pattern.replace('*', ''))
  const { blobs } = await list({ prefix })
  return blobs.map(b =>
    b.pathname.replace(/^kv\//, '').replace(/\.json$/, '')
  )
}

export const store = {
  get: async (key: string): Promise<unknown> => {
    if (USE_BLOB) return blobRead(key)
    return mem[key] ?? null
  },
  set: async (key: string, value: unknown): Promise<void> => {
    if (USE_BLOB) { await blobWrite(key, value); return }
    mem[key] = value
  },
  del: async (key: string): Promise<void> => {
    if (USE_BLOB) { await blobDelete(key); return }
    delete mem[key]
  },
  keys: async (pattern: string): Promise<string[]> => {
    if (USE_BLOB) return blobKeys(pattern)
    const prefix = pattern.replace('*', '')
    return Object.keys(mem).filter(k => k.startsWith(prefix))
  },
}
