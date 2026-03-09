'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WarehouseBalanceData } from '@/lib/types/dashboard.types'
import { Warehouse, AlertTriangle, TrendingDown, Package, CheckCircle2 } from 'lucide-react'

interface WarehouseBalanceProps {
  data: WarehouseBalanceData[]
}

export function WarehouseBalance({ data }: WarehouseBalanceProps) {
  const overloadedCount = data.filter((d) => d.isOverloaded).length
  const underUtilizedCount = data.filter((d) => d.isUnderUtilized).length
  const optimalCount = data.length - overloadedCount - underUtilizedCount

  const getLocationStatus = (location: WarehouseBalanceData) => {
    if (location.isOverloaded) {
      return {
        label: 'Quá tải',
        topBorder: '#ef4444',
        badgeCls: 'bg-red-100 text-red-700 border-red-200',
        textColor: 'text-red-600',
        barColor: 'from-red-400 to-red-600',
        bgTint: 'bg-red-50/40',
      }
    }
    if (location.isUnderUtilized) {
      return {
        label: 'Dư thừa',
        topBorder: '#3b82f6',
        badgeCls: 'bg-blue-100 text-blue-700 border-blue-200',
        textColor: 'text-blue-600',
        barColor: 'from-blue-400 to-blue-600',
        bgTint: 'bg-blue-50/40',
      }
    }
    return {
      label: 'Tối ưu',
      topBorder: '#10b981',
      badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      textColor: 'text-emerald-600',
      barColor: 'from-emerald-400 to-emerald-600',
      bgTint: 'bg-emerald-50/40',
    }
  }

  const avgCapacity =
    data.length > 0
      ? (data.reduce((sum, d) => sum + d.capacityUsed, 0) / data.length).toFixed(1)
      : '0'
  const totalValue = data.reduce((sum, d) => sum + d.totalValue, 0)

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 via-purple-500/5 to-transparent px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Warehouse className="h-4 w-4 text-white" />
            </div>
            Phân Tích Cân Bằng Kho
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              {overloadedCount} Quá tải
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <TrendingDown className="h-3 w-3" />
              {underUtilizedCount} Dư thừa
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {optimalCount} Tối ưu
            </span>
          </div>
        </div>
      </div>

      <CardContent className="pt-5">
        {/* Summary Banner */}
        <div className="mb-5 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm">
          <div className="flex flex-col items-center gap-0.5 px-4 py-3">
            <p className="text-xs font-medium text-gray-400">Tổng vị trí</p>
            <p className="text-2xl font-bold text-gray-800">{data.length}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-4 py-3">
            <p className="text-xs font-medium text-gray-400">Công suất TB</p>
            <p className="text-2xl font-bold text-purple-600">{avgCapacity}%</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-4 py-3">
            <p className="text-xs font-medium text-gray-400">Tổng giá trị</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Location Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((location) => {
            const status = getLocationStatus(location)
            return (
              <div
                key={location.locationId}
                className={`card-hover relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ${status.bgTint}`}
              >
                {/* Colored top border */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: status.topBorder }}
                />

                <div className="p-4 pt-5">
                  {/* Location name + badge */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{location.locationName}</h3>
                      <p className="text-xs text-gray-400">{location.shelfId}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.badgeCls}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Công suất</span>
                      <span className={`font-bold ${status.textColor}`}>
                        {location.capacityUsed}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full bg-gradient-to-r ${status.barColor} transition-all duration-700`}
                        style={{ width: `${location.capacityUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-gray-100">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Sản phẩm
                      </p>
                      <p className="text-sm font-bold text-gray-800">{location.totalProducts}</p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-gray-100">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Số lượng
                      </p>
                      <p className="text-sm font-bold text-gray-800">{location.totalQuantity}</p>
                    </div>
                  </div>

                  {/* Total value */}
                  <div className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-gray-100">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      Tổng giá trị
                    </p>
                    <p className="text-sm font-bold text-purple-600">
                      {formatCurrency(location.totalValue)}
                    </p>
                  </div>

                  {/* Transfer suggestions */}
                  {location.transferSuggestions && location.transferSuggestions.length > 0 && (
                    <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-2.5">
                      <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-orange-700">
                        <AlertTriangle className="h-3 w-3" />
                        Gợi ý điều chuyển
                      </p>
                      <ul className="space-y-0.5 text-xs text-gray-700">
                        {location.transferSuggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
