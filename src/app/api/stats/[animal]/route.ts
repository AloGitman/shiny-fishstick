import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAccount } from '@/lib/auth'
import { getAnimalStats } from '@/lib/stats'
import { getWikiImageUrl } from '@/lib/wiki'

export async function GET(
  req: NextRequest,
  { params }: { params: { animal: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccount(payload.gameId)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const animalName = decodeURIComponent(params.animal)
  const stats = await getAnimalStats(animalName)

  if (!stats) {
    return NextResponse.json({ error: 'No data for this animal yet' }, { status: 404 })
  }

  const imageUrl = await getWikiImageUrl(animalName)

  return NextResponse.json({ ...stats, imageUrl })
}
