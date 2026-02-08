'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Package, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getReturnOrderDetail } from '@/services/api/returns.api'
import type { ReturnOrderDetail } from '@/lib/types'

interface ReturnOrderDetailPageProps {
  params: {
    id: string
  }
}

export default function ReturnOrderDetailPage({ params }: ReturnOrderDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [orderDetail, setOrderDetail] = useState<ReturnOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetail()
  }, [params.id])

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true)
      const response = await getReturnOrderDetail(parseInt(params.id))

      if (response.isSuccess && response.data) {
        setOrderDetail(response.data)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải chi tiết đơn trả hàng',
      })
      
      if (error.response?.status === 404) {
        setTimeout(() => router.push('/dashboard/returns'), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Pending: 'outline',
      Processed: 'default',
      Approved: 'secondary',
      Completed: 'default',
      Rejected: 'destructive',
    }

    const labels: Record<string, string> = {
      Pending: 'Chờ xử lý',
      Processed: 'Đã xử lý',
      Approved: 'Đã duyệt',
      Completed: 'Hoàn thành',
      Rejected: 'Từ chối',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getReasonLabel = (reasonCode: string) => {
    const labels: Record<string, string> = {
      DEFECTIVE: 'Sản phẩm bị lỗi/hỏng',
      WRONG_ITEM: 'Giao sai hàng',
      CUSTOMER_CHANGE: 'Khách hàng đổi ý',
      EXPIRED: 'Sản phẩm hết hạn',
    }
    return labels[reasonCode] || reasonCode
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy đơn trả hàng</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/returns')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const { header, lines } = orderDetail

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/returns')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Chi Tiết Đơn Trả Hàng #{header.returnOrderId}
            </h1>
            <p className="text-gray-500 mt-1">
              Liên kết với đơn xuất #{header.exportOrderId}
            </p>
          </div>
        </div>
        {getStatusBadge(header.status)}
      </div>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông Tin Đơn Trả Hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Thời gian nhận hàng</p>
                  <p className="font-medium">{formatDate(header.checkInTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Người kiểm tra</p>
                  <p className="font-medium">{header.checkedByName || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Người duyệt</p>
                  <p className="font-medium">{header.reviewedByName || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Mã đơn xuất liên kết</p>
                  <p className="font-medium">#{header.exportOrderId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="font-medium">{header.note || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Danh Sách Sản Phẩm Trả ({lines.length} sản phẩm)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Mã SP</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead>Lý do trả hàng</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-center">Vị trí</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((item, index) => (
                <TableRow key={item.returnDetailId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">#{item.productId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{item.quantity}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {item.reasonCode}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        {getReasonLabel(item.reasonCode)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {item.note || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.locationId ? (
                      <Badge variant="outline">Khu #{item.locationId}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">Tổng số lượng sản phẩm trả:</p>
              <p className="text-2xl font-bold text-purple-600">
                {lines.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/returns')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
          onClick={() => window.print()}
        >
          In phiếu trả hàng
        </Button>
      </div>
    </div>
  )
}
