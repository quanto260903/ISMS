'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      gradient: 'from-purple-600 to-purple-400',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Doanh Thu Tháng',
      value: formatCurrency(data.monthlyRevenue),
      icon: data.valueGrowthRate >= 0 ? TrendingUp : TrendingDown,
      gradient: 'from-green-600 to-green-400',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: data.valueGrowthRate,
    },
    {
      title: 'Tổng Sản Phẩm',
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      gradient: 'from-blue-600 to-blue-400',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Vị Trí Lưu Kho',
      value: data.totalLocations.toLocaleString(),
      icon: MapPin,
      gradient: 'from-teal-600 to-teal-400',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      title: 'Công Suất Kho TB',
      value: `${data.averageCapacityUsage}%`,
      icon: Package,
      gradient: 'from-indigo-600 to-indigo-400',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      progress: data.averageCapacityUsage,
    },
    {
      title: 'Cảnh Báo Tồn Thấp',
      value: data.lowStockAlertCount.toLocaleString(),
      icon: AlertTriangle,
      gradient: 'from-orange-600 to-orange-400',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      alert: data.lowStockAlertCount > 0,
    },
    {
      title: 'Sắp Hết Hạn',
      value: data.nearExpiryCount.toLocaleString(),
      icon: Clock,
      gradient: 'from-yellow-600 to-yellow-400',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      alert: data.nearExpiryCount > 0,
    },
    {
      title: 'Hàng Quá Hạn',
      value: data.expiredStockCount.toLocaleString(),
      icon: XCircle,
      gradient: 'from-red-600 to-red-400',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      loss: formatCurrency(data.totalPotentialLoss),
      alert: data.expiredStockCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className="overflow-hidden transition-all hover:shadow-lg"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${metric.iconBg}`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.trend !== undefined && (
                <div
                  className={`flex items-center text-sm font-medium ${
                    metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metric.trend >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(metric.trend).toFixed(1)}%
                </div>
              )}
            </div>

            {metric.progress !== undefined && (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.gradient} transition-all`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            )}

            {metric.loss && (
              <p className="mt-1 text-xs text-red-600">
                Thiệt hại: {metric.loss}
              </p>
            )}

            {metric.alert && (
              <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Cần xử lý</span>
              </div>
            )}
          </CardContent>
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
