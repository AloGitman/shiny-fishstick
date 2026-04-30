import { NextRequest, NextResponse } from 'next/server'
import { ensureDefaultAdmin, getAccount, signToken, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await ensureDefaultAdmin()

  const { gameId, password } = await req.json()

  if (!gameId || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const account = await getAccount(String(gameId))
  if (!account) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, account.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken(account.gameId)

  return NextResponse.json({
    token,
    gameId: account.gameId,
    isAdmin: account.isAdmin,
    mustChangePassword: account.mustChangePassword,
  })
}
