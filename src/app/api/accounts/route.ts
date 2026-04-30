export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getAccount, verifyToken, listAccounts, hashPassword, saveAccount, deleteAccount } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const account = await getAccount(payload.gameId)
  return account?.isAdmin ? account : null
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const accounts = await listAccounts()
    return Response.json(accounts.map(a => ({
      gameId: a.gameId, isAdmin: a.isAdmin,
      mustChangePassword: a.mustChangePassword, createdAt: a.createdAt,
    })))
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const { gameId, password, isAdmin } = await req.json()
    if (!gameId || !password) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (await getAccount(String(gameId))) return Response.json({ error: 'Account already exists' }, { status: 409 })
    await saveAccount({ gameId: String(gameId), passwordHash: await hashPassword(password), isAdmin: !!isAdmin, mustChangePassword: true, createdAt: Date.now() })
    return Response.json({ ok: true })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const { gameId } = await req.json()
    if (!gameId) return Response.json({ error: 'Missing gameId' }, { status: 400 })
    if (String(gameId) === '0') return Response.json({ error: 'Cannot delete root admin' }, { status: 400 })
    await deleteAccount(String(gameId))
    return Response.json({ ok: true })
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
