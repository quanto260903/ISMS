// ============================================================
//  middleware.ts  — đặt ở root project (cạnh app/)
// ============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes công khai — không cần token
const PUBLIC_ROUTES = ['/login', '/register', '/unauthorized']

// Routes chỉ Admin (role = 1) mới vào được
const ADMIN_ONLY_ROUTES = [
  '/dashboard/settings/users',
  '/dashboard/settings/roles',
  '/dashboard/user-management',
]

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token    = request.cookies.get('token')?.value
  const userRole = request.cookies.get('userRole')?.value   // "1" | "2" | "3" | "4"
  const isLoggedIn = !!token

  // ── 1. Trang root "/" → redirect thẳng vào app ──────────
  if (pathname === '/') {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Admin → /dashboard, còn lại → /dashboard/inventory
    const home = userRole === '1' ? '/dashboard' : '/dashboard/inventory'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // ── 2. Public routes ─────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Đã login rồi thì không cho vào /login, /register nữa
    if (isLoggedIn && pathname !== '/unauthorized') {
      const home = userRole === '1' ? '/dashboard' : '/dashboard/inventory'
      return NextResponse.redirect(new URL(home, request.url))
    }
    const res = NextResponse.next()
    addSecurityHeaders(res)
    return res
  }

  // ── 3. Protected routes — phải có token ──────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)   // quay lại sau khi login
      return NextResponse.redirect(loginUrl)
    }

    // ── 4. Admin-only routes ────────────────────────────────
    const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))
    if (isAdminRoute && userRole !== '1') {    // UserRole.Admin = 1
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  const res = NextResponse.next()
  addSecurityHeaders(res)
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)'],
}