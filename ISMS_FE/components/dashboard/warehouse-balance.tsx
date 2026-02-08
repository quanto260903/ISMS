'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { WarehouseBalanceData } from '@/lib/types/dashboard.types'
import { Warehouse, AlertTriangle, TrendingDown, Package } from 'lucide-react'

interface WarehouseBalanceProps {
  data: WarehouseBalanceData[]
}

export function WarehouseBalance({ data }: WarehouseBalanceProps) {
  const overloadedCount = data.filter((d) => d.isOverloaded).length
  const underUtilizedCount = data.filter((d) => d.isUnderUtilized).length
  const optimalCount = data.length - overloadedCount - underUtilizedCount

  // Get status for location
  const getLocationStatus = (location: WarehouseBalanceData) => {
    if (location.isOverloaded) {
      return {
        label: 'Quá tải',
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      }
    }
    if (location.isUnderUtilized) {
      return {
        label: 'Dư thừa',
        variant: 'outline' as const,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      }
    }
    return {
      label: 'Tối ưu',
      variant: 'outline' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    }
  }

  // Get progress color
  const getProgressColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500'
    if (usage >= 75) return 'bg-orange-500'
    if (usage >= 50) return 'bg-green-500'
    if (usage >= 25) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-purple-600" />
            Phân Tích Cân Bằng Kho
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overloadedCount} Quá tải
            </Badge>
            <Badge variant="outline" className="gap-1 border-blue-500 text-blue-500">
              <TrendingDown className="h-3 w-3" />
              {underUtilizedCount} Dư thừa
            </Badge>
            <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
              <Package className="h-3 w-3" />
              {optimalCount} Tối ưu
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((location) => {
            const status = getLocationStatus(location)
            return (
              <Card
                key={location.locationId}
                className={`${status.borderColor} border-2 ${status.bgColor}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{location.locationName}</h3>
                      <p className="text-sm text-gray-500">{location.shelfId}</p>
                    </div>
                    <Badge variant={status.variant} className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Capacity Usage */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Công suất</span>
                      <span className={`font-semibold ${status.color}`}>
                        {location.capacityUsed}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${getProgressColor(
                          location.capacityUsed
                        )}`}
                        style={{ width: `${location.capacityUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-xs text-gray-500">Sản phẩm</p>
                      <p className="font-semibold">{location.totalProducts}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-xs text-gray-500">Số lượng</p>
                      <p className="font-semibold">{location.totalQuantity}</p>
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-xs text-gray-500">Tổng giá trị</p>
                    <p className="font-semibold text-purple-600">
                      {formatCurrency(location.totalValue)}
                    </p>
                  </div>

                  {/* Transfer Suggestions */}
                  {location.transferSuggestions &&
                    location.transferSuggestions.length > 0 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                        <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-orange-700">
                          <AlertTriangle className="h-3 w-3" />
                          Gợi ý điều chuyển
                        </p>
                        <ul className="space-y-1 text-xs text-gray-700">
                          {location.transferSuggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg border bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Tổng vị trí</p>
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Công suất TB</p>
            <p className="text-2xl font-bold text-purple-600">
              {(
                data.reduce((sum, d) => sum + d.capacityUsed, 0) / data.length
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Tổng giá trị</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                data.reduce((sum, d) => sum + d.totalValue, 0)
              )}
            </p>
          </div>
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
