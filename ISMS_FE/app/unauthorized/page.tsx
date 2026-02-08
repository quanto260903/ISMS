'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Clear 401 error flag khi vào trang này
    sessionStorage.removeItem('401_error');

    // Set current time on client-side only
    setCurrentTime(new Date().toLocaleString('vi-VN'));
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Container layout ngang */}
      <div className="min-h-screen grid lg:grid-cols-2 gap-0">

        {/* Bên trái - Illustration/Visual */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center p-8 lg:p-12">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-2xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-md">
            {/* Large icon with animation */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-md p-8 rounded-full border-4 border-white/30">
                <ShieldAlert className="w-24 h-24 lg:w-32 lg:h-32 text-white drop-shadow-2xl" />
              </div>
            </div>

            {/* Error code */}
            <h1 className="text-8xl lg:text-9xl font-black text-white mb-4 drop-shadow-lg tracking-tight">
              401
            </h1>

            <div className="flex items-center justify-center gap-3 text-white/90 mb-6">
              <Lock className="w-6 h-6" />
              <span className="text-xl lg:text-2xl font-bold">Unauthorized Access</span>
            </div>

            {/* Decorative text */}
            <p className="text-white/70 text-sm lg:text-base max-w-sm mx-auto leading-relaxed">
              Khu vực này được bảo vệ và yêu cầu quyền truy cập đặc biệt
            </p>
          </div>
        </div>

        {/* Bên phải - Content & Actions */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-white/50 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-8">

            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Không có quyền truy cập</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Bạn không có quyền truy cập trang này
              </h2>

              <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
                Trang này yêu cầu bạn phải đăng nhập hoặc cần tài khoản có quyền cao hơn để tiếp tục.
              </p>
            </div>

            {/* Info box */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-violet-500 rounded-lg p-2 mt-1">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-violet-900 font-semibold text-lg mb-2">
                    Các bước bạn có thể thực hiện:
                  </h3>
                  <ul className="space-y-3 text-violet-800 text-sm lg:text-base">
                    <li className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-violet-500" />
                      <span>Đăng nhập với tài khoản có quyền truy cập phù hợp</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-violet-500" />
                      <span>Liên hệ quản trị viên để được cấp quyền truy cập</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-violet-500" />
                      <span>Quay về trang chủ để sử dụng các tính năng khác</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-14 text-base font-semibold"
              >
                <Home className="w-5 h-5 mr-2" />
                Trở về trang chủ
              </Button>

              <Button
                onClick={() => router.push('/login')}
                size="lg"
                variant="outline"
                className="flex-1 border-2 border-violet-300 hover:bg-violet-50 hover:border-violet-400 transition-all duration-300 h-14 text-base font-semibold"
              >
                <Lock className="w-5 h-5 mr-2" />
                Đăng nhập lại
              </Button>
            </div>

            {/* Footer info */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs lg:text-sm text-gray-400 text-center">
                Mã lỗi: <span className="font-mono font-semibold">401 - Unauthorized</span>
                <span className="mx-2">•</span>
                <span>{currentTime || 'Đang tải...'}</span>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
