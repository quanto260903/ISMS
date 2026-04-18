'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User, Warehouse, TrendingUp, Package, BarChart3, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { register, isLoading: storeLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập họ tên' })
      return false
    }
    if (!formData.email.trim()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập email' })
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Email không hợp lệ' })
      return false
    }
    if (formData.password.length < 6) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mật khẩu phải có ít nhất 6 ký tự' })
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mật khẩu xác nhận không khớp' })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 1,
      })

      toast({
        title: 'Đăng ký thành công',
        description: 'Chào mừng bạn đến với hệ thống quản lý kho',
      })

      window.location.href = '/dashboard'
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại'
      toast({ variant: 'destructive', title: 'Đăng ký thất bại', description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

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
              Tạo hệ thống<br />kho của bạn
            </h2>
            <p className="text-purple-100 text-lg">
              Đăng ký để trở thành quản trị viên và quản lý toàn bộ hệ thống kho hàng
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Quản lý hàng hóa</h3>
            <p className="text-purple-100 text-sm">Theo dõi tồn kho theo thời gian thực</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Phiếu nhập xuất</h3>
            <p className="text-purple-100 text-sm">Xử lý phiếu kho nhanh chóng</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Báo cáo tổng hợp</h3>
            <p className="text-purple-100 text-sm">Sổ tồn kho và phân tích chi tiết</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Phân quyền nhân viên</h3>
            <p className="text-purple-100 text-sm">Quản lý Manager và Staff dễ dàng</p>
          </div>
        </div>

        <div className="relative z-10 text-purple-100 text-sm">
          © 2024 WMS Pro. All rights reserved.
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <Card className="w-full max-w-md border-0 shadow-2xl my-8">
          <CardContent className="pt-8 px-8 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-500 rounded-2xl mb-4">
                <Warehouse className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h2>
              <p className="text-gray-500 text-sm">Đăng ký để bắt đầu quản lý hệ thống kho</p>
            </div>

            {/* Admin badge */}
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-700">Tài khoản Quản trị viên (Admin)</p>
                <p className="text-xs text-purple-500">Bạn có toàn quyền quản lý hệ thống và tạo tài khoản cho nhân viên</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="pl-11 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-11 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-11 pr-11 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || storeLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 mt-2"
              >
                {isLoading || storeLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang đăng ký...</span>
                  </div>
                ) : (
                  'Tạo tài khoản Admin'
                )}
              </Button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Đã có tài khoản?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Đăng nhập ngay
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
