// Called by the Roblox game's ExistCountService to push live animal stats.
// Auth: gameId + password in the Authorization header as "gameId:password" base64.

import { NextRequest, NextResponse } from 'next/server'
import { ensureDefaultAdmin, getAccount, verifyPassword } from '@/lib/auth'
import { processReport } from '@/lib/stats'

export async function POST(req: NextRequest) {
  await ensureDefaultAdmin()

  const authHeader = req.headers.get('authorization') ?? ''
  const [scheme, encoded] = authHeader.split(' ')

  if (scheme !== 'Basic' || !encoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
  const colonIdx = decoded.indexOf(':')
  const gameId = decoded.slice(0, colonIdx)
  const password = decoded.slice(colonIdx + 1)

  const account = await getAccount(gameId)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const valid = await verifyPassword(password, account.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()

  if (!payload?.animalName) {
    return NextResponse.json({ error: 'Missing animalName' }, { status: 400 })
  }

  await processReport(payload)

  return NextResponse.json({ ok: true })
}
