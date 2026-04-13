'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Link2Off,
  Lock,
  ShieldCheck,
  Warehouse,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authService } from '@/services/api/auth.api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get('token') ?? ''
  const hasToken = token.length > 0

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasToken) {
      toast({
        variant: 'destructive',
        title: 'Link không hợp lệ',
        description: 'Không tìm thấy token đặt lại mật khẩu.',
      })
      return
    }

    if (!password || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Mật khẩu không khớp',
        description: 'Mật khẩu xác nhận phải trùng với mật khẩu mới.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authService.resetPassword({
        token,
        newPassword: password,
        confirmPassword,
      })

      setIsSubmitted(true)

      toast({
        title: 'Đổi mật khẩu thành công',
        description: response.message || 'Mật khẩu của bạn đã được cập nhật.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Đổi mật khẩu thất bại',
        description: error.response?.data?.message || error.message || 'Không thể đổi mật khẩu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">WMS Pro</h1>
              <p className="text-sm text-purple-100">Warehouse Management</p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
              Đặt lại mật khẩu
              <br />
              Bảo mật và liền mạch
            </h2>
            <p className="text-lg text-purple-100">
              Tạo mật khẩu mới để khôi phục quyền truy cập và tiếp tục sử dụng hệ thống.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Bảo mật nhiều lớp</h3>
            <p className="text-sm text-purple-100">
              Chỉ liên kết hợp lệ mới được phép tạo mật khẩu mới.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Khôi phục nhanh</h3>
            <p className="text-sm text-purple-100">
              Hoàn tất đổi mật khẩu trong một màn hình duy nhất.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Mật khẩu mạnh hơn</h3>
            <p className="text-sm text-purple-100">
              Khuyến khích tạo mật khẩu mới khác với mật khẩu cũ.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Clock3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Trở lại tức thì</h3>
            <p className="text-sm text-purple-100">
              Sau khi hoàn tất, người dùng có thể đăng nhập lại ngay.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-purple-100">© 2024 WMS Pro. All rights reserved.</div>
      </div>

      <div className="flex-1 bg-gray-50 p-8">
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardContent className="px-8 pb-8 pt-8">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-purple-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </button>

              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500">
                  {isSubmitted ? (
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  ) : hasToken ? (
                    <KeyRound className="h-8 w-8 text-white" />
                  ) : (
                    <Link2Off className="h-8 w-8 text-white" />
                  )}
                </div>
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  {isSubmitted
                    ? 'Đặt lại mật khẩu thành công'
                    : hasToken
                      ? 'Tạo mật khẩu mới'
                      : 'Liên kết không hợp lệ'}
                </h2>
                <p className="text-gray-500">
                  {isSubmitted
                    ? 'Bạn có thể dùng mật khẩu mới để đăng nhập vào hệ thống.'
                    : hasToken
                      ? 'Nhập mật khẩu mới và xác nhận để hoàn tất quá trình khôi phục.'
                      : 'Liên kết đặt lại mật khẩu bị thiếu hoặc đã hết hạn.'}
                </p>
              </div>

              {isSubmitted ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="mb-2 font-semibold text-emerald-900">Mật khẩu đã được cập nhật</p>
                    <p className="text-sm leading-6 text-emerald-800">
                      Tài khoản của bạn đã sẵn sàng để đăng nhập lại bằng mật khẩu mới.
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="h-12 w-full bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:from-purple-700 hover:to-teal-600"
                    onClick={() => router.push('/login')}
                  >
                    Đi tới đăng nhập
                  </Button>
                </div>
              ) : hasToken ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-medium text-gray-700">
                      Mật khẩu mới
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu mới"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-12 border-gray-300 pl-11 pr-11 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-medium text-gray-700">
                      Xác nhận mật khẩu mới
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="h-12 border-gray-300 pl-11 pr-11 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-gray-700">
                    Gợi ý: dùng ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số hoặc ký tự đặc biệt để
                    tăng độ an toàn.
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full bg-gradient-to-r from-purple-600 to-teal-500 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-teal-600 hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Đang cập nhật...</span>
                      </div>
                    ) : (
                      'Cập nhật mật khẩu'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <p className="mb-2 font-semibold text-amber-900">Không tìm thấy token đặt lại</p>
                    <p className="text-sm leading-6 text-amber-800">
                      Hãy yêu cầu lại email khôi phục để nhận một liên kết đặt lại mật khẩu mới.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                      onClick={() => router.push('/forgot-password')}
                    >
                      Gửi lại liên kết
                    </Button>
                    <Button
                      type="button"
                      className="h-12 bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:from-purple-700 hover:to-teal-600"
                      onClick={() => router.push('/login')}
                    >
                      Đăng nhập
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
