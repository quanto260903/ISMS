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
  const criticalCount = data.filter((d) => d.alertLevel === '🔴 CRITICAL').length
  const warningCount = data.filter((d) => d.alertLevel === '🟡 WARNING').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            Cảnh Báo Tồn Kho Tối Thiểu - Gợi Ý Đặt Hàng
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{criticalCount} Khẩn cấp</Badge>
            <Badge variant="outline" className="border-orange-500 text-orange-500">
              {warningCount} Cảnh báo
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>Không có cảnh báo tồn kho</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center">Tồn hiện tại</TableHead>
                  <TableHead className="text-center">Tối thiểu</TableHead>
                  <TableHead className="text-center">Thiếu hụt</TableHead>
                  <TableHead className="text-right">Nên đặt</TableHead>
                  <TableHead className="text-right">Chi phí ước tính</TableHead>
                  <TableHead className="text-center">Mức độ</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.serialNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.currentStock}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.minimumStock}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-red-600">
                        -{item.shortageQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-purple-600">
                        {item.suggestedOrderQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.estimatedCost)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.alertLevel === '🔴 CRITICAL'
                            ? 'destructive'
                            : 'outline'
                        }
                        className={
                          item.alertLevel === '🟡 WARNING'
                            ? 'border-orange-500 text-orange-500'
                            : ''
                        }
                      >
                        {item.alertLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        Đặt hàng
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
  const criticalCount = data.filter((d) => d.expiryStatus === '🔴 CRITICAL')
    .length
  const nearExpiryCount = data.filter(
    (d) => d.expiryStatus === '🟡 NEAR_EXPIRY'
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Phân Tích Hạn Sử Dụng (FEFO) - {daysThreshold} Ngày
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{criticalCount} Khẩn cấp</Badge>
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              {nearExpiryCount} Sắp hết hạn
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Clock className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>Không có sản phẩm sắp hết hạn trong {daysThreshold} ngày tới</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Lô hàng</TableHead>
                  <TableHead className="text-center">Hạn sử dụng</TableHead>
                  <TableHead className="text-center">Còn (ngày)</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead className="text-center">Vị trí</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Đề xuất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.serialNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{item.batchNumber}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.daysUntilExpiry <= 7 ? 'destructive' : 'outline'
                        }
                        className={
                          item.daysUntilExpiry > 7 && item.daysUntilExpiry <= 30
                            ? 'border-yellow-500 text-yellow-500'
                            : ''
                        }
                      >
                        {item.daysUntilExpiry}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="text-center">
                      <code className="text-xs">{item.locationInfo}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.expiryStatus === '🔴 CRITICAL'
                            ? 'destructive'
                            : 'outline'
                        }
                        className={
                          item.expiryStatus === '🟡 NEAR_EXPIRY'
                            ? 'border-yellow-500 text-yellow-500'
                            : ''
                        }
                      >
                        {item.expiryStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {item.actionSuggestions.map((suggestion, i) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DeadStockAlertsProps {
  data: DeadStockData[]
}

export function DeadStockAlerts({ data }: DeadStockAlertsProps) {
  const totalLoss = data.reduce((sum, item) => sum + item.totalLoss, 0)

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            Báo Cáo Hàng Quá Hạn (Dead Stock)
          </CardTitle>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {data.length} sản phẩm - Thiệt hại: {formatCurrency(totalLoss)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <XCircle className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>Không có hàng quá hạn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center">Hết hạn</TableHead>
                  <TableHead className="text-center">Quá hạn (ngày)</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Giá trị gốc</TableHead>
                  <TableHead className="text-right">Thanh lý</TableHead>
                  <TableHead className="text-right">Thiệt hại</TableHead>
                  <TableHead className="text-center">Vị trí</TableHead>
                  <TableHead>Người chịu trách nhiệm</TableHead>
                  <TableHead className="text-center">Xử lý</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index} className="bg-red-50/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.serialNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{item.daysOverdue}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.originalValue)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(item.liquidationValue)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      -{formatCurrency(item.totalLoss)}
                    </TableCell>
                    <TableCell className="text-center">
                      <code className="text-xs">{item.locationInfo}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {item.responsibleUserName}
                        </p>
                        <p className="text-xs text-gray-500">{item.responsibleRole}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.disposalStatus}</Badge>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.disposalMethod}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
