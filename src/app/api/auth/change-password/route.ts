import { NextRequest, NextResponse } from 'next/server'
import { getAccount, hashPassword, saveAccount, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { newPassword } = await req.json()
  if (!newPassword || newPassword.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const account = await getAccount(payload.gameId)
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  account.passwordHash = await hashPassword(newPassword)
  account.mustChangePassword = false
  await saveAccount(account)

  return NextResponse.json({ ok: true })
}
