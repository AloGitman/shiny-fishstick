export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { deleteAccount, getAccount, hashPassword, listAccounts, saveAccount, verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const account = await getAccount(payload.gameId)
  if (!account?.isAdmin) return null
  return account
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const accounts = await listAccounts()
  return NextResponse.json(accounts.map(a => ({
    gameId: a.gameId,
    isAdmin: a.isAdmin,
    mustChangePassword: a.mustChangePassword,
    createdAt: a.createdAt,
  })))
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { gameId, password, isAdmin } = await req.json()
  if (!gameId || !password)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const existing = await getAccount(String(gameId))
  if (existing)
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 })

  await saveAccount({
    gameId: String(gameId),
    passwordHash: await hashPassword(password),
    isAdmin: !!isAdmin,
    mustChangePassword: true,
    createdAt: Date.now(),
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { gameId } = await req.json()
  if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
  if (String(gameId) === '0')
    return NextResponse.json({ error: 'Cannot delete root admin' }, { status: 400 })

  await deleteAccount(String(gameId))
  return NextResponse.json({ ok: true })
}
