'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Package,
  MapPin,
  AlertTriangle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react'
import { DashboardOverview } from '@/lib/types/dashboard.types'

interface MetricCardsProps {
  data: DashboardOverview
}

export function MetricCards({ data }: MetricCardsProps) {
  const metrics = [
    {
      title: 'Tổng Giá Trị Tồn Kho',
      value: formatCurrency(data.totalStockValue),
      icon: DollarSign,
      gradient: 'from-purple-500 to-violet-600',
      iconGradient: 'from-purple-500 to-violet-600',
      topBorder: '#8b5cf6',
    },
    {
      title: 'Doanh Thu Tháng',
      value: formatCurrency(data.monthlyRevenue),
      icon: data.valueGrowthRate >= 0 ? TrendingUp : TrendingDown,
      gradient: 'from-emerald-400 to-green-600',
      iconGradient: 'from-emerald-400 to-green-600',
      topBorder: '#10b981',
      trend: data.valueGrowthRate,
    },
    {
      title: 'Tổng Sản Phẩm',
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      gradient: 'from-sky-400 to-blue-600',
      iconGradient: 'from-sky-400 to-blue-600',
      topBorder: '#3b82f6',
    },
    {
      title: 'Vị Trí Lưu Kho',
      value: data.totalLocations.toLocaleString(),
      icon: MapPin,
      gradient: 'from-teal-400 to-cyan-600',
      iconGradient: 'from-teal-400 to-cyan-600',
      topBorder: '#14b8a6',
    },
    {
      title: 'Công Suất Kho TB',
      value: `${data.averageCapacityUsage}%`,
      icon: Package,
      gradient: 'from-indigo-400 to-indigo-600',
      iconGradient: 'from-indigo-400 to-indigo-600',
      topBorder: '#6366f1',
      progress: data.averageCapacityUsage,
    },
    {
      title: 'Cảnh Báo Tồn Thấp',
      value: data.lowStockAlertCount.toLocaleString(),
      icon: AlertTriangle,
      gradient: 'from-orange-400 to-orange-600',
      iconGradient: 'from-orange-400 to-orange-600',
      topBorder: '#f97316',
      alert: data.lowStockAlertCount > 0,
      alertType: 'orange' as const,
    },
    {
      title: 'Sắp Hết Hạn',
      value: data.nearExpiryCount.toLocaleString(),
      icon: Clock,
      gradient: 'from-yellow-400 to-amber-600',
      iconGradient: 'from-yellow-400 to-amber-600',
      topBorder: '#f59e0b',
      alert: data.nearExpiryCount > 0,
      alertType: 'orange' as const,
    },
    {
      title: 'Hàng Quá Hạn',
      value: data.expiredStockCount.toLocaleString(),
      icon: XCircle,
      gradient: 'from-rose-400 to-red-600',
      iconGradient: 'from-rose-400 to-red-600',
      topBorder: '#ef4444',
      loss: formatCurrency(data.totalPotentialLoss),
      alert: data.expiredStockCount > 0,
      alertType: 'red' as const,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className={`card-hover animate-fade-up animate-delay-${index} relative overflow-hidden border-0 bg-white shadow-md ${
            metric.alert
              ? metric.alertType === 'red'
                ? 'animate-alert-pulse'
                : 'animate-orange-pulse'
              : ''
          }`}
        >
          {/* Gradient top border */}
          <div
            className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${metric.gradient}`}
          />

          <div className="flex flex-col gap-3 px-5 pb-5 pt-6">
            {/* Title + Icon row */}
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-gray-500">
                {metric.title}
              </p>
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${metric.iconGradient} shadow-md`}
              >
                <metric.icon className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Value + Trend */}
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {metric.value}
              </span>
              {metric.trend !== undefined && (
                <span
                  className={`flex items-center text-sm font-semibold ${
                    metric.trend >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {metric.trend >= 0 ? (
                    <TrendingUp className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="mr-1 h-3.5 w-3.5" />
                  )}
                  {Math.abs(metric.trend).toFixed(1)}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {metric.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Đã dùng</span>
                  <span className="font-medium text-gray-600">
                    {metric.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.gradient} transition-all duration-700`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Loss */}
            {metric.loss && (
              <p className="text-xs font-medium text-red-500">
                Thiệt hại: {metric.loss}
              </p>
            )}

            {/* Alert chip */}
            {metric.alert && (
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                  metric.alertType === 'red'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-orange-50 text-orange-600'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Cần xử lý
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
