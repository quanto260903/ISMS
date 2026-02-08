'use client'

import { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard as Home,
  Package,
  ShoppingCart,
  Box,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  User,
  Users,
  Warehouse,
  Palette,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { HeaderSearch } from '@/components/header-search'
import { UserRole, getRoleName } from '@/lib/types/user.types'
import { Toaster } from '@/components/ui/sonner'


const navGroups = [
  {
    title: 'Tổng quan',
    items: [
      { href: '/dashboard', icon: Home, label: 'Dashboard', requiredRole: UserRole.Admin },
      { href: '/dashboard/ai-search', icon: Sparkles, label: 'AI Search' },
    ]
  },
  {
    title: 'Quản lý sản phẩm',
    items: [
      { href: '/dashboard/products-list', icon: Package, label: 'Danh sách SP' },
      { href: '/dashboard/products', icon: Package, label: 'SP Hết hạn' },
      { href: '/dashboard/inventory', icon: Box, label: 'Tồn kho' },
    ]
  },
  {
    title: 'Quản lý đơn hàng',
    items: [
      { href: '/dashboard/import-orders', icon: ArrowDownToLine, label: 'Đơn Nhập' },
      { href: '/dashboard/export-orders', icon: ArrowUpFromLine, label: 'Đơn Xuất' },
      { href: '/dashboard/returns', icon: RotateCcw, label: 'Trả Hàng' },
    ]
  },
  {
    title: 'Quản lý Hệ thống',
    items: [
      {
        href: '/dashboard/user-management',
        icon: Users,
        label: 'Quản lý Người dùng',
        requiredRole: [UserRole.Admin, UserRole.Manager]
      },
    ]
  },
  {
    title: 'Khác',
    items: [
      { href: '/ui-showcase', icon: Palette, label: 'Thư viện UI' },
    ]
  },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-purple-600 to-purple-700 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">WMS Pro</h1>
                <p className="text-xs text-purple-200">v2.0</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-white/10 text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => {
            // Filter items based on user role
            const visibleItems = group.items.filter((item: any) => {
              // If item has no requiredRole, show it to everyone
              if (!item.requiredRole) return true;

              // If requiredRole is an array, check if user's role is in the array
              if (Array.isArray(item.requiredRole)) {
                return item.requiredRole.includes(user?.role);
              }

              // If requiredRole is a single value, check if user's role matches
              return user?.role === item.requiredRole;
            });

            // Don't render group if no visible items
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                {sidebarOpen && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item: any) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-purple-100 hover:bg-white/10 hover:text-white'
                          }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="border-t border-purple-500/30 p-2">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-1 ${pathname === '/dashboard/settings'
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-purple-100 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Search */}
            <HeaderSearch />

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-600 to-teal-500 border-0">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-teal-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.role !== undefined ? getRoleName(user.role) : 'User'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <User className="w-4 h-4 mr-2" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
