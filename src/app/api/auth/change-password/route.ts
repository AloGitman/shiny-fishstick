export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAccount, hashPassword, saveAccount, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { newPassword } = await req.json()
    if (!newPassword || newPassword.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    const account = await getAccount(payload.gameId)
    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 })
    account.passwordHash = await hashPassword(newPassword)
    account.mustChangePassword = false
    await saveAccount(account)
    return Response.json({ ok: true })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
