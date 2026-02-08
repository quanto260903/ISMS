'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Trash2, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getExportOrderDetail,
  deleteExportDetail,
} from '@/services/api/export-orders.api'
import type { ExportOrderDetail } from '@/lib/types'

export default function ExportOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const exportOrderId = Number(params.id)

  const [orderDetails, setOrderDetails] = useState<ExportOrderDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetails()
  }, [exportOrderId])

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      const detailsResponse = await getExportOrderDetail(exportOrderId)
      if (detailsResponse.isSuccess && detailsResponse.data) {
        setOrderDetails(Array.isArray(detailsResponse.data) ? detailsResponse.data : [])
      } else {
        setOrderDetails([])
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải chi tiết đơn xuất hàng',
      })
      router.push('/dashboard/export-orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDetail = async (exportDetailId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    try {
      const response = await deleteExportDetail(exportDetailId)
      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa sản phẩm',
        })
        fetchOrderDetails()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa sản phẩm',
      })
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getTotalPrice = () => {
    return orderDetails.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  }

  const getTotalQuantity = () => {
    return orderDetails.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails.length) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Không tìm thấy chi tiết sản phẩm</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/export-orders')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
          Chi Tiết Sản Phẩm Đơn Xuất #{exportOrderId}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Sản Phẩm ({orderDetails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[60px]">STT</TableHead>
                  <TableHead>Mã SP</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderDetails.map((item, index) => (
                  <TableRow key={item.exportDetailId}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">SP-{item.productId}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDetail(item.exportDetailId!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={2} className="text-right">
                    Tổng cộng:
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{getTotalQuantity()}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-purple-600 text-lg">
                    {formatCurrency(getTotalPrice())}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
