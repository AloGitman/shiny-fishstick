const mem: Record<string, unknown> = {}
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN

function blobPath(key: string) {
  return `kv/${key.replace(/[^a-zA-Z0-9._\-:/]/g, '_')}.json`
}

async function blobRead(key: string): Promise<unknown> {
  try {
    const { list } = await import('@vercel/blob')
    const path = blobPath(key)
    const { blobs } = await list({ prefix: path })
    const found = blobs.find((b: { pathname: string }) => b.pathname === path)
    if (!found) return null
    const res = await fetch((found as { url: string }).url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function blobWrite(key: string, value: unknown): Promise<void> {
  const { put } = await import('@vercel/blob')
  await put(blobPath(key), JSON.stringify(value), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

async function blobDelete(key: string): Promise<void> {
  try {
    const { list, del } = await import('@vercel/blob')
    const path = blobPath(key)
    const { blobs } = await list({ prefix: path })
    const found = blobs.find((b: { pathname: string }) => b.pathname === path)
    if (found) await del((found as { url: string }).url)
  } catch {}
}

async function blobKeys(pattern: string): Promise<string[]> {
  try {
    const { list } = await import('@vercel/blob')
    const prefix = blobPath(pattern.replace('*', ''))
    const { blobs } = await list({ prefix })
    return blobs.map((b: { pathname: string }) =>
      b.pathname.replace(/^kv\//, '').replace(/\.json$/, '')
    )
  } catch {
    return []
  }
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
