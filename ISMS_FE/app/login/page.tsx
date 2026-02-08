'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, Warehouse, TrendingUp, Package, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/api/auth.api'
import { UserRole } from '@/lib/types/user.types'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login, isLoading: storeLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    const isNewUser = searchParams.get('isNewUser')
    const error = searchParams.get('error')

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Xác thực thất bại',
        description: error === 'access_denied' ? 'Quyền truy cập bị từ chối' : 'Đã xảy ra lỗi',
      })
    }

    if (token) {
      toast({
        title: isNewUser === 'true' ? 'Chào mừng!' : 'Chào mừng trở lại!',
        description: isNewUser === 'true' ? 'Tài khoản của bạn đã được tạo' : 'Bạn đã đăng nhập thành công',
      })
      // Redirect to root, middleware will handle role-based redirect
      window.location.href = '/'
    }
  }, [searchParams, toast, router])

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()

    try {
      // Call login from auth store
      await login({ email, password })

      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn đến với Hệ thống quản lý kho',
      })

      // Get user from store to check role
      const currentUser = useAuthStore.getState().user

      // Determine redirect URL based on role
      let redirectUrl = '/dashboard/ai-search' // Default for Staff/Manager
      if (currentUser?.role === UserRole.Admin) {
        redirectUrl = '/dashboard' // Admin can access dashboard
      }

      // Override with query param if provided
      const queryRedirect = searchParams.get('redirect')
      if (queryRedirect) {
        redirectUrl = queryRedirect
      }

      // Use window.location for hard navigation to ensure middleware runs
      window.location.href = redirectUrl
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại'

      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)

      // Get Google OAuth URL
      const response = await authService.getGoogleAuthUrl()

      if (response.isSuccess && response.data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.data.authUrl
      } else {
        throw new Error(response.message || 'Không thể lấy URL đăng nhập Google')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message || 'Không thể đăng nhập bằng Google',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background with Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Logo and Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Warehouse className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">WMS Pro</h1>
              <p className="text-purple-100 text-sm">Warehouse Management</p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Quản lý kho hàng<br />Hiệu quả và Chuyên nghiệp
            </h2>
            <p className="text-purple-100 text-lg">
              Giải pháp toàn diện cho quản lý tồn kho, đơn hàng và phân tích
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Kiểm soát tồn kho</h3>
            <p className="text-purple-100 text-sm">Theo dõi và quản lý hàng tồn kho theo thời gian thực</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Xử lý đơn hàng</h3>
            <p className="text-purple-100 text-sm">Quy trình thực hiện đơn hàng được tối ưu hóa</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Phân tích dữ liệu</h3>
            <p className="text-purple-100 text-sm">Báo cáo và thống kê toàn diện</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Đa vị trí</h3>
            <p className="text-purple-100 text-sm">Quản lý nhiều kho hàng cùng lúc</p>
          </div>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 text-purple-100 text-sm">
          © 2024 WMS Pro. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="pt-8 px-8 pb-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-500 rounded-2xl mb-4">
                <Warehouse className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
              <p className="text-gray-500">Đăng nhập để tiếp tục sử dụng hệ thống</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Địa chỉ Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium text-gray-700">Đăng nhập với Google</span>
            </Button>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Đăng ký miễn phí
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
