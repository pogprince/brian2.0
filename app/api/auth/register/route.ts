import { NextRequest, NextResponse } from 'next/server'
import { createUser, ensureDefaultUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, name, password } = body

  if (!username || !name || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  try {
    const user = await createUser({ username, name, password, provider: 'credentials' })
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 409 })
  }
}
