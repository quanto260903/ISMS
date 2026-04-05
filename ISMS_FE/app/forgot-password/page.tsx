'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  KeyRound,
  LifeBuoy,
  Mail,
  ShieldCheck,
  Warehouse,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authService } from '@/services/api/auth.api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      toast({
        variant: 'destructive',
        title: 'Thiếu email',
        description: 'Vui lòng nhập email đã đăng ký.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authService.forgotPassword(normalizedEmail)

      setEmail(normalizedEmail)
      setIsSubmitted(true)

      toast({
        title: 'Đã gửi yêu cầu',
        description:
          response.message || 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link reset mật khẩu.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gửi yêu cầu thất bại',
        description:
          error.response?.data?.message || error.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.',
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
              Khôi phục truy cập
              <br />
              Nhanh chóng và an toàn
            </h2>
            <p className="text-lg text-purple-100">
              Nhận liên kết đặt lại mật khẩu qua email để tiếp tục sử dụng hệ thống.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Bảo mật tài khoản</h3>
            <p className="text-sm text-purple-100">
              Yêu cầu khôi phục được xác minh qua email đã đăng ký.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Liên kết một lần</h3>
            <p className="text-sm text-purple-100">
              Mỗi liên kết reset chỉ dùng cho một lần thao tác.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Clock3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Xử lý nhanh</h3>
            <p className="text-sm text-purple-100">
              Hoàn tất yêu cầu chỉ với vài bước đơn giản.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <LifeBuoy className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Dễ quay lại</h3>
            <p className="text-sm text-purple-100">
              Có thể quay về đăng nhập hoặc gửi lại yêu cầu bất kỳ lúc nào.
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
                  ) : (
                    <KeyRound className="h-8 w-8 text-white" />
                  )}
                </div>
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  {isSubmitted ? 'Kiểm tra email của bạn' : 'Quên mật khẩu?'}
                </h2>
                <p className="text-gray-500">
                  {isSubmitted
                    ? 'Chúng tôi đã ghi nhận yêu cầu đặt lại mật khẩu của bạn.'
                    : 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.'}
                </p>
              </div>

              {isSubmitted ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="mb-2 font-semibold text-emerald-900">Yêu cầu đã được gửi</p>
                    <p className="text-sm leading-6 text-emerald-800">
                      Nếu tài khoản tồn tại với địa chỉ <span className="font-semibold">{email}</span>,
                      bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong ít phút.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Chưa thấy email? Hãy kiểm tra thư mục spam hoặc thử gửi lại yêu cầu.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                      onClick={() => setIsSubmitted(false)}
                    >
                      Gửi lại email
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
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-medium text-gray-700">
                      Địa chỉ Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 border-gray-300 pl-11 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-gray-700">
                    Chúng tôi sẽ gửi cho bạn một liên kết đặt lại mật khẩu nếu email này đã được đăng ký
                    trong hệ thống.
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full bg-gradient-to-r from-purple-600 to-teal-500 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-teal-600 hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Đang gửi yêu cầu...</span>
                      </div>
                    ) : (
                      'Gửi liên kết đặt lại'
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    Nhớ mật khẩu rồi?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
