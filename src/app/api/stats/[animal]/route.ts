export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAccount, verifyToken } from '@/lib/auth'
import { getAnimalStats } from '@/lib/stats'
import { getWikiImageUrl } from '@/lib/wiki'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ animal: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const account = await getAccount(payload.gameId)
    if (!account) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { animal } = await context.params
    const animalName = decodeURIComponent(animal)
    const stats = await getAnimalStats(animalName)
    if (!stats) return Response.json({ error: 'No data for this animal yet' }, { status: 404 })

    const imageUrl = await getWikiImageUrl(animalName)
    return Response.json({ ...stats, imageUrl })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
