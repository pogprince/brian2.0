import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE = 'brain_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function getPassword(): string {
  return process.env.BRAIN_PASSWORD || 'brain' // default password for local dev
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateSession(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function validatePassword(password: string): boolean {
  return password === getPassword()
}

export async function createSession(): Promise<string> {
  const token = generateSession()
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })

  // Store hashed token for validation
  // For MVP, we store in a simple file. Extension point: use a proper session store
  const fs = await import('fs/promises')
  const path = await import('path')
  const sessionDir = path.join(process.cwd(), 'data', 'sessions')
  await fs.mkdir(sessionDir, { recursive: true })
  await fs.writeFile(
    path.join(sessionDir, `${hashToken(token)}.json`),
    JSON.stringify({ created: Date.now(), expires: Date.now() + SESSION_DURATION }),
    'utf-8'
  )

  return token
}

export async function validateSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return false

    const fs = await import('fs/promises')
    const path = await import('path')
    const sessionFile = path.join(process.cwd(), 'data', 'sessions', `${hashToken(token)}.json`)

    const raw = await fs.readFile(sessionFile, 'utf-8')
    const session = JSON.parse(raw)

    if (Date.now() > session.expires) {
      await fs.unlink(sessionFile).catch(() => {})
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const sessionFile = path.join(process.cwd(), 'data', 'sessions', `${hashToken(token)}.json`)
      await fs.unlink(sessionFile).catch(() => {})
    }
    cookieStore.delete(SESSION_COOKIE)
  } catch {}
}
