'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Combobox } from '@/components/ui/combobox'
import { Plus, FileText, Eye, Trash2, Check, Download, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getImportOrders,
  getImportOrderStatuses,
  getProviders,
  bulkApproveImportOrders,
  bulkDeleteImportOrders,
  deleteImportOrder,
  exportImportOrdersToExcel,
} from '@/services/api/import-orders.api'
import type { ImportOrderListItem, Provider, ImportOrderStatusStats } from '@/lib/types'
import { DataTable } from '@/components/data-table'
import type { DataTableColumn } from '@/components/data-table'

export default function ImportOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<ImportOrderListItem[]>([])
  const [statuses, setStatuses] = useState<ImportOrderStatusStats[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Hardcoded statuses for Import Orders
  const importStatuses = [
    { status: 'Pending', label: 'Chờ duyệt' },
    { status: 'Approved', label: 'Đã duyệt' },
    { status: 'Completed', label: 'Hoàn thành' },
    { status: 'Cancelled', label: 'Đã hủy' },
  ]

  useEffect(() => {
    fetchProviders()
    fetchOrders()
  }, [currentPage, pageSize])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchOrders()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, providerFilter, fromDate, toDate])

  const fetchProviders = async () => {
    try {
      const data = await getProviders()
      setProviders(data)
    } catch (error: any) {
      console.error('Failed to fetch providers:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách nhà cung cấp',
      })
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await getImportOrders({
        q: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        providerId: providerFilter !== 'all' ? parseInt(providerFilter) : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        pageSize,
      })

      setOrders(response.items || [])
      setTotalItems(response.total || 0)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách đơn nhập hàng',
      })
      setOrders([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedOrders.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một đơn nhập hàng',
      })
      return
    }

    try {
      const response = await bulkApproveImportOrders({
        importOrderIds: selectedOrders,
        note: 'Duyệt hàng loạt',
      })

      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: response.message || `Đã duyệt ${response.data?.successCount} đơn nhập hàng`,
        })
        setSelectedOrders([])
        fetchOrders()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể duyệt đơn nhập hàng',
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return

    try {
      const response = await bulkDeleteImportOrders({
        importOrderIds: selectedOrders,
      })

      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: response.message || `Đã xóa ${response.data?.successCount} đơn nhập hàng`,
        })
        setSelectedOrders([])
        setShowDeleteDialog(false)
        fetchOrders()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa đơn nhập hàng',
      })
    }
  }

  const handleDelete = async (importOrderId: number) => {
    try {
      const response = await deleteImportOrder(importOrderId)
      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa đơn nhập hàng',
        })
        fetchOrders()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa đơn nhập hàng',
      })
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const blob = await exportImportOrdersToExcel({
        from: fromDate || undefined,
        to: toDate || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `import-orders-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Thành công',
        description: 'Đã xuất file Excel',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xuất file Excel',
      })
    } finally {
      setIsExporting(false)
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
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const columns: DataTableColumn<ImportOrderListItem>[] = [
    {
      key: 'select',
      header: '',
      cell: (order: ImportOrderListItem) => (
        <Checkbox
          checked={selectedOrders.includes(order.importOrderId)}
          onCheckedChange={(checked) => {
            setSelectedOrders(prev =>
              checked
                ? [...prev, order.importOrderId]
                : prev.filter(id => id !== order.importOrderId)
            )
          }}
        />
      ),
    },
    {
      key: 'importOrderId',
      header: 'Mã đơn',
      cell: (order: ImportOrderListItem) => (
        <span className="font-medium">#{order.importOrderId}</span>
      ),
      sortable: true,
    },
    {
      key: 'invoiceNumber',
      header: 'Số hóa đơn',
      cell: (order: ImportOrderListItem) => order.invoiceNumber,
      sortable: true,
    },
    {
      key: 'orderDate',
      header: 'Ngày đặt',
      cell: (order: ImportOrderListItem) => formatDate(order.orderDate),
      sortable: true,
    },
    {
      key: 'providerName',
      header: 'Nhà cung cấp',
      cell: (order: ImportOrderListItem) => order.providerName,
    },
    {
      key: 'totalItems',
      header: 'Số lượng',
      cell: (order: ImportOrderListItem) => (
        <Badge variant="outline">{order.totalItems} SP</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (order: ImportOrderListItem) => getStatusBadge(order.status),
    },
    {
      key: 'createdByName',
      header: 'Người tạo',
      cell: (order: ImportOrderListItem) => order.createdByName || '-',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Đơn Nhập Hàng
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý đơn nhập hàng từ nhà cung cấp
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
          <Button
            onClick={() => router.push('/dashboard/import-orders/new')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo Đơn Nhập Hàng
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Đã chọn {selectedOrders.length} đơn nhập hàng
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkApprove}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt hàng loạt
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa hàng loạt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {importStatuses.map((item) => (
                    <SelectItem key={item.status} value={item.status}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nhà cung cấp</label>
              <Combobox
                options={[
                  { value: 'all', label: 'Tất cả nhà cung cấp' },
                  ...providers.map((provider) => ({
                    value: provider.partnerId.toString(),
                    label: provider.name,
                  })),
                ]}
                value={providerFilter}
                onValueChange={setProviderFilter}
                placeholder="Chọn nhà cung cấp"
                searchPlaceholder="Tìm kiếm nhà cung cấp..."
                emptyText="Không tìm thấy nhà cung cấp"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all')
                setProviderFilter('all')
                setFromDate('')
                setToDate('')
                setSearchQuery('')
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        data={orders}
        columns={columns}
        keyField="importOrderId"
        isLoading={isLoading}
        emptyMessage="Không có đơn nhập hàng nào"
        emptyIcon={<FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
        searchable
        searchPlaceholder="Tìm kiếm theo số hóa đơn, nhà cung cấp..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortable
        pagination={{
          currentPage,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
        }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        pageSizeOptions={[5, 10, 20, 50, 100]}
        actions={[
          {
            label: 'Xem',
            icon: <Eye className="h-4 w-4 mr-1" />,
            onClick: (order: ImportOrderListItem) =>
              router.push(`/dashboard/import-orders/${order.importOrderId}`),
            variant: 'ghost',
          },
          {
            label: 'Xóa',
            icon: <Trash2 className="h-4 w-4 mr-1" />,
            onClick: (order: ImportOrderListItem) => handleDelete(order.importOrderId),
            variant: 'destructive' as const,
          },
        ]}
        onRowClick={(order: ImportOrderListItem) =>
          router.push(`/dashboard/import-orders/${order.importOrderId}`)
        }
        hoverable
        striped
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedOrders.length} đơn nhập hàng đã chọn?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
