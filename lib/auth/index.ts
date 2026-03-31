// Auth utilities — user management for NextAuth
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

export interface UserRecord {
  id: string
  username: string
  name: string
  email?: string
  password_hash?: string
  provider?: string
  image?: string
  created_at: string
  last_login?: string
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

async function readUsers(): Promise<UserRecord[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true })
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const users = await readUsers()
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await readUsers()
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null
}

export async function authenticateUser(username: string, password: string): Promise<UserRecord | null> {
  const user = await findUserByUsername(username)
  if (!user || !user.password_hash) return null
  if (!verifyPassword(password, user.password_hash)) return null

  user.last_login = new Date().toISOString()
  const users = await readUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) {
    users[idx] = user
    await writeUsers(users)
  }
  return user
}

export async function createUser(params: {
  username: string
  name: string
  email?: string
  password?: string
  provider?: string
  image?: string
}): Promise<UserRecord> {
  const users = await readUsers()

  if (users.some(u => u.username.toLowerCase() === params.username.toLowerCase())) {
    throw new Error('Username already exists')
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    username: params.username,
    name: params.name,
    email: params.email,
    password_hash: params.password ? hashPassword(params.password) : undefined,
    provider: params.provider || 'credentials',
    image: params.image,
    created_at: new Date().toISOString(),
  }

  users.push(user)
  await writeUsers(users)
  return user
}

export async function findOrCreateOAuthUser(params: {
  email: string
  name: string
  provider: string
  image?: string
}): Promise<UserRecord> {
  let user = await findUserByEmail(params.email)
  if (user) {
    user.last_login = new Date().toISOString()
    if (params.image) user.image = params.image
    const users = await readUsers()
    const idx = users.findIndex(u => u.id === user!.id)
    if (idx >= 0) {
      users[idx] = user
      await writeUsers(users)
    }
    return user
  }

  const username = params.email.split('@')[0] + '-' + Date.now().toString(36)
  return createUser({
    username,
    name: params.name,
    email: params.email,
    provider: params.provider,
    image: params.image,
  })
}

// Seed default admin if no users exist
export async function ensureDefaultUser(): Promise<void> {
  const users = await readUsers()
  if (users.length === 0) {
    const pw = process.env.BRAIN_PASSWORD || 'brain'
    await createUser({
      username: 'admin',
      name: 'Admin',
      password: pw,
      provider: 'credentials',
    })
  }
}
