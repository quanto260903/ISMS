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
  ClipboardCheck,
  Layers,
  UsersRound,
  Truck,
  Network,
  Wallet,
  FileBarChart2,
  ScrollText,
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
import { UserRole, getRoleName } from '@/lib/types/user.types'
import { Toaster } from '@/components/ui/sonner'
import { useAutoLogout } from '@/hooks/useAutoLogout'


const navGroups = [
  {
    title: 'Tổng quan',
    items: [
      { href: '/dashboard', icon: Home, label: 'Dashboard', requiredRole: UserRole.Admin },
    ]
  },
  {
    title: 'Quản lý sản phẩm',
    items: [
     
    ]
  },
  {
    title: 'Quản lý đơn hàng',
    items: [
      { href: '/dashboard/import', icon: ArrowDownToLine, label: 'Nhập kho' },
      { href: '/dashboard/export', icon: ArrowUpFromLine, label: 'Xuất kho' },
      { href: '/dashboard/stock-take', icon: ClipboardCheck, label: 'Kiểm kê kho' },
      { href: '/dashboard/sale', icon: RotateCcw, label: 'Bán hàng' },
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
    {
      href: '/dashboard/goods-category',
      icon: Layers,
      label: 'Quản lý nhóm hàng hóa'
    },
    {
      href: '/dashboard/goods',
      icon: Package,
      label: 'Quản lý hàng hóa',
      requiredRole: [UserRole.Admin]
    },
    {
      href: '/dashboard/customers',
      icon: User,
      label: 'Quản lý khách hàng',
      requiredRole: [UserRole.Admin, UserRole.Manager]
    },
    {
      href: '/dashboard/suppliers',
      icon: Truck,
      label: 'Quản lý nhà cung cấp',
      requiredRole: [UserRole.Admin, UserRole.Manager]
    }
  ]
},
  {
    title: 'Báo cáo',
    items: [
      {
        href: '/dashboard/inventory-report',
        icon: FileBarChart2,
        label: 'Báo cáo tồn kho',
        requiredRole: [UserRole.Admin, UserRole.Manager],
      },
      {
        href: '/dashboard/activity-log',
        icon: ScrollText,
        label: 'Nhật ký hoạt động',
        requiredRole: [UserRole.Admin, UserRole.Manager],
      },
    ]
  },
  {
    title: 'Khác',
    items: [
      { href: '/ui-showcase', icon: Palette, label: 'Thư viện UI' },
      { href: '/dashboard/open-inventory', icon: Wallet, label: 'Nhập số dư đầu' },
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
useAutoLogout() 
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-xl bg-white/20" style={{ animationDuration: '3s' }} />
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-inner">
                <Warehouse className="h-5 w-5 text-white" />
              </div>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-base font-bold text-white">WMS Pro</h1>
                <p className="text-[10px] font-medium text-purple-200/80">v2.0 · Warehouse System</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
          <div className="space-y-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item: any) => {
                if (!item.requiredRole) return true
                if (Array.isArray(item.requiredRole)) {
                  return item.requiredRole.includes(user?.role)
                }
                return user?.role === item.requiredRole
              })

              if (visibleItems.length === 0) return null

              return (
                <div key={group.title}>
                  {sidebarOpen && (
                    <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-purple-300/70">
                      {group.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item: any) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-white/20 text-white shadow-sm'
                              : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
                          }`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          {/* Active left border accent */}
                          {isActive && (
                            <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-white/90" />
                          )}
                          <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-105'}`} />
                          {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom: Settings & Logout */}
        <div className="border-t border-white/10 p-2 space-y-0.5">
          <Link
            href="/dashboard/settings"
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              pathname === '/dashboard/settings'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {pathname === '/dashboard/settings' && (
              <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-white/90" />
            )}
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-100/80 transition-all duration-200 hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
          {/* Subtle purple tint stripe */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />
          <div className="flex h-16 items-center justify-end px-6">
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Notifications with ping animation */}
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
                  <span className="animate-notification-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-[8px] font-bold text-white">
                    3
                  </span>
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 rounded-lg px-2 hover:bg-gray-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user?.role !== undefined ? getRoleName(user.role) : 'User'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
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
