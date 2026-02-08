'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Package, Loader2, Clock, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { productApi } from '@/services/api/product.api'
import type { ProductNearExpired, ProductExpiry } from '@/lib/types'

export default function ProductsPage() {
  const { toast } = useToast()

  const [nearExpiredProducts, setNearExpiredProducts] = useState<any[]>([])
  const [expiredProducts, setExpiredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)

      const [nearExpiredData, expiredData] = await Promise.all([
        productApi.getNearExpired(),
        productApi.getExpired(),
      ])

      // Handle both array and ApiResponse wrapper formats
      const nearExpired = Array.isArray(nearExpiredData)
        ? nearExpiredData
        : (nearExpiredData?.data || [])

      const expired = Array.isArray(expiredData)
        ? expiredData
        : (expiredData?.data || [])

      setNearExpiredProducts(nearExpired)
      setExpiredProducts(expired)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách sản phẩm',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getWarningBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive">Nguy hiểm</Badge>
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-orange-500">Cảnh báo</Badge>
    } else {
      return <Badge className="bg-yellow-500">Lưu ý</Badge>
    }
  }

  const getAlertVariant = (count: number) => {
    if (count === 0) return 'default'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
          Quản Lý Sản Phẩm
        </h1>
        <p className="text-gray-500 mt-1">
          Theo dõi hạn sử dụng và tình trạng sản phẩm
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert variant={getAlertVariant(expiredProducts.length)}>
          <X className="h-4 w-4" />
          <AlertTitle>Sản phẩm đã hết hạn</AlertTitle>
          <AlertDescription>
            <span className="text-2xl font-bold">{expiredProducts.length}</span> sản phẩm cần xử lý ngay
          </AlertDescription>
        </Alert>

        <Alert variant={getAlertVariant(nearExpiredProducts.length)}>
          <Clock className="h-4 w-4" />
          <AlertTitle>Sản phẩm sắp hết hạn</AlertTitle>
          <AlertDescription>
            <span className="text-2xl font-bold">{nearExpiredProducts.length}</span> sản phẩm cần theo dõi
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs for Expired and Near Expired */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <Tabs defaultValue="near-expired" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="near-expired">
                  Sắp hết hạn ({nearExpiredProducts.length})
                </TabsTrigger>
                <TabsTrigger value="expired">
                  Đã hết hạn ({expiredProducts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="near-expired" className="mt-6">
                {nearExpiredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Không có sản phẩm sắp hết hạn</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã SP</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Lô hàng</TableHead>
                          <TableHead>Hạn sử dụng</TableHead>
                          <TableHead className="text-center">Số ngày còn lại</TableHead>
                          <TableHead className="text-center">Tồn kho</TableHead>
                          <TableHead>Mức độ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nearExpiredProducts.map((product: any) => (
                          <TableRow key={`${product.productId}-${product.batchNumber || product.serialNumber}`}>
                            <TableCell className="font-mono">
                              {product.serialNumber || product.productCode || '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name || product.productName || '-'}
                            </TableCell>
                            <TableCell>{product.batchNumber || '-'}</TableCell>
                            <TableCell>{formatDate(product.expiredDate || product.expiryDate)}</TableCell>
                            <TableCell className="text-center">
                              <span className={
                                product.daysUntilExpiry <= 7 
                                  ? 'text-red-600 font-bold'
                                  : product.daysUntilExpiry <= 30
                                  ? 'text-orange-600 font-semibold'
                                  : 'text-yellow-600'
                              }>
                                {product.daysUntilExpiry} ngày
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {product.stockQuantity || 0}
                            </TableCell>
                            <TableCell>
                              {getWarningBadge(product.daysUntilExpiry)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired" className="mt-6">
                {expiredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Không có sản phẩm đã hết hạn</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã SP</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Lô hàng</TableHead>
                          <TableHead>Hạn sử dụng</TableHead>
                          <TableHead className="text-center">Đã quá hạn</TableHead>
                          <TableHead className="text-center">Tồn kho</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiredProducts.map((product: any) => (
                          <TableRow key={`${product.productId}-${product.batchNumber || product.serialNumber}`}>
                            <TableCell className="font-mono">
                              {product.serialNumber || product.productCode || '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name || product.productName || '-'}
                            </TableCell>
                            <TableCell>{product.batchNumber || '-'}</TableCell>
                            <TableCell>{formatDate(product.expiredDate || product.expiryDate)}</TableCell>
                            <TableCell className="text-center text-red-600 font-bold">
                              {Math.abs(product.daysUntilExpiry)} ngày
                            </TableCell>
                            <TableCell className="text-center">
                              {product.stockQuantity || 0}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Hết hạn
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
