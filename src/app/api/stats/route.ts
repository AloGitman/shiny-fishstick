import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAccount } from '@/lib/auth'
import { listAnimalNames } from '@/lib/stats'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await getAccount(payload.gameId)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const names = await listAnimalNames()
  return NextResponse.json({ animals: names.sort() })
}
