import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_TOKEN_KEY } from '@/constants/auth'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24,
}

/** POST — store token in httpOnly cookie */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set(AUTH_TOKEN_KEY, token, COOKIE_OPTIONS)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/** GET — return token from cookie */
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value

  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 })
  }

  return NextResponse.json({ token })
}

/** DELETE — clear auth cookie */
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_TOKEN_KEY)

  return NextResponse.json({ success: true })
}
