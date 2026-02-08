'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Check, X, FileCheck, Download, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/auth'
import {
  getImportOrderDetail,
  approveImportOrder,
  rejectImportOrder,
  exportImportOrderToPDF,
  deleteImportOrder,
} from '@/services/api/import-orders.api'
import type { ImportOrderDetail } from '@/lib/types'

type ActionType = 'approve' | 'reject' | null

export default function ImportOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const importOrderId = Number(params.id)

  const [order, setOrder] = useState<ImportOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionType>(null)
  const [actionNote, setActionNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Check if user is manager (roleId = 2)
  const isManager = user?.role === 2

  useEffect(() => {
    fetchOrderDetail()
  }, [importOrderId])

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true)
      const data = await getImportOrderDetail(importOrderId)
      setOrder(data)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải chi tiết đơn nhập hàng',
      })
      router.push('/dashboard/import-orders')
    } finally {
      setIsLoading(false)
    }
  }

  const openActionDialog = (action: ActionType) => {
    setCurrentAction(action)
    setActionNote('')
    setShowActionDialog(true)
  }

  const handleAction = async () => {
    if (!currentAction) return

    try {
      setIsProcessing(true)
      let response

      switch (currentAction) {
        case 'approve':
          response = await approveImportOrder(importOrderId, { note: actionNote })
          break
        case 'reject':
          response = await rejectImportOrder(importOrderId, { 
            reason: actionNote || 'Không phù hợp',
          })
          break
      }

      if (response?.isSuccess) {
        toast({
          title: 'Thành công',
          description: response.message || 'Đã cập nhật trạng thái đơn nhập hàng',
        })
        setShowActionDialog(false)
        fetchOrderDetail()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể thực hiện thao tác',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      const blob = await exportImportOrderToPDF(importOrderId)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `import-order-${importOrderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Thành công',
        description: 'Đã xuất file PDF',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xuất file PDF',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn nhập hàng này?')) return

    try {
      const response = await deleteImportOrder(importOrderId)
      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa đơn nhập hàng',
        })
        router.push('/dashboard/import-orders')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa đơn nhập hàng',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Pending: 'outline',
      Approved: 'secondary',
      Completed: 'default',
      Cancelled: 'destructive',
    }

    const labels: Record<string, string> = {
      Pending: 'Chờ duyệt',
      Approved: 'Đã duyệt',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="text-sm">
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getActionLabel = (action: ActionType) => {
    switch (action) {
      case 'approve':
        return 'Duyệt đơn'
      case 'reject':
        return 'Từ chối'
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy đơn nhập hàng</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/import-orders')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Chi Tiết Đơn Nhập #{importOrderId}
            </h1>
            <p className="text-gray-500 mt-1">
              Số hóa đơn: {order.invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
          </Button>
          {order.status === 'Pending' && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/import-orders/${importOrderId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Thông Tin Đơn Hàng</span>
            {getStatusBadge(order.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Số hóa đơn</p>
              <p className="font-semibold text-lg">{order.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày đặt hàng</p>
              <p className="font-semibold">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nhà cung cấp</p>
              <p className="font-semibold">{order.providerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Người tạo</p>
              <p className="font-semibold">{order.createdByName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="font-semibold">{formatDate(order.createdDate || order.orderDate)}</p>
            </div>
            {order.approvedByName && (
              <div>
                <p className="text-sm text-gray-500">Người duyệt</p>
                <p className="font-semibold">{order.approvedByName}</p>
              </div>
            )}
            {order.completedByName && (
              <div>
                <p className="text-sm text-gray-500">Người hoàn thành</p>
                <p className="font-semibold">{order.completedByName}</p>
              </div>
            )}
          </div>
          {order.note && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
              <p className="text-gray-700">{order.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons - Only show for Manager (roleId = 2) */}
      {isManager && order.status === 'Pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-800">Đơn hàng chờ duyệt</p>
                <p className="text-sm text-yellow-600">Vui lòng duyệt hoặc từ chối đơn hàng này</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => openActionDialog('reject')}
                >
                  <X className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => openActionDialog('approve')}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt đơn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Sản Phẩm ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[60px]">STT</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Giá nhập</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={item.importDetailId}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.importPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.quantity * item.importPrice)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={2} className="text-right">
                    Tổng cộng:
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </Badge>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right text-blue-600 text-lg">
                    {formatCurrency(
                      order.items.reduce((sum, item) => sum + item.quantity * item.importPrice, 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionLabel(currentAction)}</DialogTitle>
            <DialogDescription>
              {currentAction === 'reject'
                ? 'Vui lòng nhập lý do từ chối đơn hàng'
                : 'Bạn có thể thêm ghi chú cho thao tác này'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={
                currentAction === 'reject'
                  ? 'Lý do từ chối...'
                  : 'Ghi chú (tùy chọn)...'
              }
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={4}
              required={currentAction === 'reject'}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing || (currentAction === 'reject' && !actionNote.trim())}
              className={
                currentAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : currentAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
            >
              {isProcessing ? 'Đang xử lý...' : getActionLabel(currentAction)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
