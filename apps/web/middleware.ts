import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/health', '/api/builder/templates', '/api/storage']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protect dashboard / builder / generated
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/builder') || pathname.startsWith('/generated') || pathname.startsWith('/api/')
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('accessToken')?.value || req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const payload = verifyToken(token)
    const res = NextResponse.next()
    res.headers.set('x-user-id', String((payload as any).id || (payload as any).sub))
    return res
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Token invalid' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/builder/:path*', '/generated/:path*', '/api/:path*']
}
