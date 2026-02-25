// lib/auth/kid.ts
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { redirect } from 'next/navigation'

const KID_COOKIE = 'kid-session'
const EXPIRY_HOURS = 4

function getSecret() {
  const secret = process.env.KID_SESSION_SECRET
  if (!secret) throw new Error('KID_SESSION_SECRET not set')
  return new TextEncoder().encode(secret)
}

export interface KidSession {
  kid_id: string
  parent_id: string
  kid_name: string
}

export async function createKidSession(payload: KidSession): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_HOURS}h`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(KID_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY_HOURS * 60 * 60,
    path: '/',
  })
}

export async function getKidSession(): Promise<KidSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(KID_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      kid_id: payload.kid_id as string,
      parent_id: payload.parent_id as string,
      kid_name: payload.kid_name as string,
    }
  } catch {
    return null
  }
}

export async function requireKidSession(kidId: string): Promise<KidSession> {
  const session = await getKidSession()
  if (!session || session.kid_id !== kidId) {
    redirect('/kid-login')
  }
  return session
}

export async function clearKidSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(KID_COOKIE)
}
