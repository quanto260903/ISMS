'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MinimumStockAlert,
  ExpiryAnalysisData,
  DeadStockData,
} from '@/lib/types/dashboard.types'
import {
  AlertTriangle,
  Clock,
  XCircle,
  ShoppingCart,
  Package,
  Flame,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface MinimumStockAlertsProps {
  data: MinimumStockAlert[]
}

export function MinimumStockAlerts({ data }: MinimumStockAlertsProps) {
  const criticalItems = data.filter((d) => d.alertLevel === '🔴 CRITICAL')
  const warningItems = data.filter((d) => d.alertLevel === '🟡 WARNING')
  const totalEstimatedCost = data.reduce((sum, item) => sum + item.estimatedCost, 0)

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            Cảnh Báo Tồn Kho Tối Thiểu
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              <Flame className="h-3 w-3" />
              {criticalItems.length} Khẩn cấp
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              <AlertTriangle className="h-3 w-3" />
              {warningItems.length} Cảnh báo
            </span>
          </div>
        </div>
      </div>

      <CardContent className="pt-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
            <p className="font-medium">Không có cảnh báo tồn kho</p>
            <p className="mt-1 text-xs text-gray-300">Tất cả sản phẩm đang ở mức an toàn</p>
          </div>
        ) : (
          <>
            {/* Summary chip */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-orange-50 px-4 py-2.5">
              <span className="text-sm font-medium text-orange-700">
                Chi phí đặt hàng ước tính
              </span>
              <span className="text-sm font-bold text-orange-800">
                {formatCurrency(totalEstimatedCost)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg ring-1 ring-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-gray-600">Sản phẩm</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Tồn hiện tại</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Tối thiểu</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Thiếu hụt</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Nên đặt</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Chi phí ước tính</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Mức độ</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const isCritical = item.alertLevel === '🔴 CRITICAL'
                    return (
                      <TableRow
                        key={item.productId}
                        className={`transition-colors ${
                          isCritical ? 'border-l-2 border-l-red-400 bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-800">{item.productName}</p>
                            <p className="text-xs text-gray-400">{item.serialNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="rounded-md border border-gray-200 px-2 py-0.5 text-sm font-medium">
                            {item.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {item.minimumStock}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-red-600">-{item.shortageQuantity}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                            {item.suggestedOrderQuantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-gray-700">
                          {formatCurrency(item.estimatedCost)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isCritical ? (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                              🔴 CRITICAL
                            </span>
                          ) : (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                              🟡 WARNING
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="h-7 gap-1 bg-gradient-to-r from-purple-500 to-violet-600 text-xs shadow-sm hover:from-purple-600 hover:to-violet-700"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Đặt hàng
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface ExpiryAlertsProps {
  data: ExpiryAnalysisData[]
  daysThreshold: number
}

export function ExpiryAlerts({ data, daysThreshold }: ExpiryAlertsProps) {
  const criticalCount = data.filter((d) => d.expiryStatus === '🔴 CRITICAL').length
  const nearExpiryCount = data.filter((d) => d.expiryStatus === '🟡 NEAR_EXPIRY').length

  return (
    <>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-7 w-7 text-gray-300" />
          </div>
          <p className="font-medium">Không có sản phẩm sắp hết hạn</p>
          <p className="mt-1 text-xs text-gray-300">trong {daysThreshold} ngày tới</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold text-gray-600">Sản phẩm</TableHead>
                <TableHead className="font-semibold text-gray-600">Lô hàng</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Hạn sử dụng</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Còn (ngày)</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Số lượng</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Giá trị</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Vị trí</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Trạng thái</TableHead>
                <TableHead className="font-semibold text-gray-600">Đề xuất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
                const isCritical = item.expiryStatus === '🔴 CRITICAL'
                return (
                  <TableRow
                    key={index}
                    className={`transition-colors ${
                      isCritical
                        ? 'border-l-2 border-l-red-400 bg-red-50/30 hover:bg-red-50/50'
                        : 'border-l-2 border-l-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.serialNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {item.batchNumber}
                      </code>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.daysUntilExpiry <= 7
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.daysUntilExpiry}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-700">{item.quantity}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-gray-700">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="text-center">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {item.locationInfo}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      {isCritical ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                          🔴 CRITICAL
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          🟡 SẮP HẾT
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-0.5 text-xs text-gray-500">
                        {item.actionSuggestions.map((suggestion, i) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

interface DeadStockAlertsProps {
  data: DeadStockData[]
}

export function DeadStockAlerts({ data }: DeadStockAlertsProps) {
  const totalLoss = data.reduce((sum, item) => sum + item.totalLoss, 0)

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Gradient header band */}
      <div className="bg-gradient-to-r from-red-600/15 via-red-500/8 to-transparent px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
              <XCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-red-700">Báo Cáo Hàng Quá Hạn (Dead Stock)</span>
          </CardTitle>
          <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-3 w-3" />
            {data.length} sản phẩm · Thiệt hại: {formatCurrency(totalLoss)}
          </span>
        </div>
      </div>

      <CardContent className="pt-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <XCircle className="h-7 w-7 text-gray-300" />
            </div>
            <p className="font-medium">Không có hàng quá hạn</p>
            <p className="mt-1 text-xs text-gray-300">Kho hàng đang trong tình trạng tốt</p>
          </div>
        ) : (
          <>
            {/* Total loss summary */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2.5">
              <span className="text-sm font-medium text-red-700">Tổng thiệt hại ước tính</span>
              <span className="text-sm font-bold text-red-800">-{formatCurrency(totalLoss)}</span>
            </div>

            <div className="overflow-x-auto rounded-lg ring-1 ring-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-gray-600">Sản phẩm</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Hết hạn</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Quá hạn (ngày)</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Số lượng</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Giá trị gốc</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Thanh lý</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Thiệt hại</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Vị trí</TableHead>
                    <TableHead className="font-semibold text-gray-600">Người chịu trách nhiệm</TableHead>
                    <TableHead className="text-center font-semibold text-gray-600">Xử lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow
                      key={index}
                      className="border-l-2 border-l-red-400 bg-red-50/20 transition-colors hover:bg-red-50/40"
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-800">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.serialNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-red-600">
                        {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                          {item.daysOverdue}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {formatCurrency(item.originalValue)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-orange-600">
                        {formatCurrency(item.liquidationValue)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-red-600">
                        -{formatCurrency(item.totalLoss)}
                      </TableCell>
                      <TableCell className="text-center">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {item.locationInfo}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.responsibleUserName}
                          </p>
                          <p className="text-xs text-gray-400">{item.responsibleRole}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
                          {item.disposalStatus}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-400">{item.disposalMethod}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
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
