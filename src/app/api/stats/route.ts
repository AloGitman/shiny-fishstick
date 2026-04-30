export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAccount, verifyToken } from '@/lib/auth'
import { listAnimalNames } from '@/lib/stats'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const account = await getAccount(payload.gameId)
    if (!account) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const names = await listAnimalNames()
    return Response.json({ animals: names.sort() })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
