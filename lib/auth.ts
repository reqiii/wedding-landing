import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_SECRET = process.env.ADMIN_PASSWORD || 'default-secret-change-me'

// Simple session management (for production, use proper JWT or NextAuth)
export function verifyPassword(password: string): boolean {
  return password === SESSION_SECRET
}

export async function createSession() {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)
  return session?.value === 'authenticated'
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}
