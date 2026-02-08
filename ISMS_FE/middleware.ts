import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes công khai - không cần authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/unauthorized']

// Routes cần authentication  
const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/inventory',
  '/dashboard/products',
  '/dashboard/orders',
  '/dashboard/reports',
  '/dashboard/settings'
]

// Routes chỉ dành cho admin (role = 2)
const ADMIN_ONLY_ROUTES = ['/dashboard/settings/users', '/dashboard/settings/roles']

/**
 * Helper function to add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('token')?.value
  const userRole = request.cookies.get('userRole')?.value

  // Kiểm tra trạng thái đăng nhập
  const isLoggedIn = !!token

  // Cho phép truy cập trang unauthorized (luôn cho phép, không kiểm tra auth)
  // Điều này đảm bảo user luôn thấy trang unauthorized khi gặp lỗi 401 từ API
  if (pathname === '/unauthorized') {
    const response = NextResponse.next()
    addSecurityHeaders(response)
    return response
  }

  // Nếu đã login và truy cập public route (trừ unauthorized) -> redirect về dashboard dựa trên role
  if (PUBLIC_ROUTES.includes(pathname) && isLoggedIn && pathname !== '/unauthorized') {
    // Admin (role = 1) -> /dashboard
    // Manager (role = 2) và Staff (role = 3) -> /dashboard/ai-search
    const defaultRoute = userRole === '1' ? '/dashboard' : '/dashboard/ai-search'
    return NextResponse.redirect(new URL(defaultRoute, request.url))
  }

  // Nếu chưa login và truy cập protected route -> redirect về unauthorized
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Kiểm tra quyền admin cho admin-only routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))
  if (isAdminRoute) {
    if (!isLoggedIn) {
      // Chưa đăng nhập -> về trang unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    } else if (userRole !== '2') {
      // Đã đăng nhập nhưng không phải admin -> về trang unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Thêm security headers cho tất cả responses
  const response = NextResponse.next()
  addSecurityHeaders(response)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
