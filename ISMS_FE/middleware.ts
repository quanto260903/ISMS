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

// Routes dành cho Admin + Manager (role = 1 hoặc 2)
const MANAGER_ROUTES = [
  '/dashboard/activity-log',
]

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
}

// Parse mảng roles từ cookie — trả về number[] hoặc [] nếu lỗi
// Hỗ trợ cả 2 format:
//   - Mới: userRoles=[1,2,3]  (JSON array)
//   - Cũ:  userRole=1         (single string — fallback tương thích ngược)
function parseRoles(raw: string | undefined): number[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(Number) : []
  } catch {
    // Fallback: cookie cũ dạng "1" đơn lẻ
    const n = Number(raw)
    return isNaN(n) ? [] : [n]
  }
}

// Trả về trang chủ tương ứng với role
// Admin   (1) → /dashboard
// Manager (2) → /dashboard/inventory-report
// Staff   (3) → /dashboard/import
// Khác        → /dashboard/inventory  (fallback)
function getHomeByRole(isAdmin: boolean, isManager: boolean, isStaff: boolean): string {
  if (isAdmin)   return '/dashboard'
  if (isManager) return '/dashboard/inventory-report'
  if (isStaff)   return '/dashboard/import'
  return ''
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token    = request.cookies.get('token')?.value
  // Đọc cookie mới (mảng roles) — fallback về cookie cũ nếu chưa migrate
  const rolesRaw = request.cookies.get('userRoles')?.value
                ?? request.cookies.get('userRole')?.value
  const roles      = parseRoles(rolesRaw)   // VD: [1, 2, 3]
  const isLoggedIn = !!token

  const isAdmin   = roles.includes(1)
  const isManager = roles.includes(2)
  const isStaff   = roles.includes(3)
 
  // ── 1. Trang root "/" → redirect thẳng vào app ──────────
  if (pathname === '/') {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const home = getHomeByRole(isAdmin, isManager, isStaff)
    return NextResponse.redirect(new URL(home, request.url))
  }

  // ── 2. Public routes ─────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Đã login rồi thì không cho vào /login, /register nữa
    if (isLoggedIn && pathname !== '/unauthorized') {
      const home = getHomeByRole(isAdmin, isManager, isStaff)
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
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // ── 5. Manager+ routes (Admin hoặc Manager) ─────────────
    const isManagerRoute = MANAGER_ROUTES.some(r => pathname.startsWith(r))
    if (isManagerRoute && !isAdmin && !isManager) {
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