export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { ensureDefaultAdmin, getAccount, signToken, verifyPassword } = await import('@/lib/auth')
    await ensureDefaultAdmin()
    const { gameId, password } = await req.json()
    if (!gameId || !password) return Response.json({ error: 'Missing credentials' }, { status: 400 })
    const account = await getAccount(String(gameId))
    if (!account) return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    if (!(await verifyPassword(password, account.passwordHash))) return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    const token = await signToken(account.gameId)
    return Response.json({ token, gameId: account.gameId, isAdmin: account.isAdmin, mustChangePassword: account.mustChangePassword })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
