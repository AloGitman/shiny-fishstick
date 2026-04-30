export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    let parsed: { gameId?: string; password?: string } = {}
    try { parsed = JSON.parse(body) } catch {}

    const { gameId, password } = parsed

    if (!gameId || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Lazy-load everything to avoid top-level import crashes
    const { ensureDefaultAdmin, getAccount, signToken, verifyPassword } = await import('@/lib/auth')

    await ensureDefaultAdmin()

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('[login]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
