import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (!validatePassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  await createSession()
  return NextResponse.json({ success: true })
}
