export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { ensureDefaultAdmin, getAccount, verifyPassword } from '@/lib/auth'
import { processReport } from '@/lib/stats'

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultAdmin()

    const authHeader = req.headers.get('authorization') ?? ''
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme !== 'Basic' || !encoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const colonIdx = decoded.indexOf(':')
    const gameId = decoded.slice(0, colonIdx)
    const password = decoded.slice(colonIdx + 1)

    const account = await getAccount(gameId)
    if (!account || !(await verifyPassword(password, account.passwordHash))) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await req.json()
    if (!payload?.animalName) return Response.json({ error: 'Missing animalName' }, { status: 400 })
    await processReport(payload)
    return Response.json({ ok: true })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
