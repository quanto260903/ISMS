'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Eye, Package, Calendar, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { filterExportOrders } from '@/services/api/export-orders.api'
import type {
  ExportOrderListItem,
  ExportOrderFilterParams,
  OrderListResponse,
} from '@/lib/types/order.types'
import { DataTable } from '@/components/data-table'
import type { DataTableColumn, DataTablePagination } from '@/components/data-table/types'

export default function ExportOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<OrderListResponse<ExportOrderListItem>>({
    total: 0,
    page: 1,
    pageSize: 10,
    items: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Status mapping: API uses string names matching enum
  const exportStatuses = [
    { value: 'Pending', label: 'Chờ xử lý', variant: 'outline' as const },
    { value: 'Shipped', label: 'Đang vận chuyển', variant: 'secondary' as const },
    { value: 'Completed', label: 'Hoàn thành', variant: 'default' as const },
    { value: 'Canceled', label: 'Đã hủy', variant: 'destructive' as const },
  ]

  useEffect(() => {
    fetchOrders()
  }, [currentPage, pageSize, statusFilter, fromDate, toDate])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)

      const params: ExportOrderFilterParams = {
        pageNumber: currentPage,
        pageSize: pageSize,
      }

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }

      if (searchQuery) {
        params.invoiceNumber = searchQuery
      }

      if (fromDate) {
        params.from = fromDate
      }

      if (toDate) {
        params.to = toDate
      }

      const response = await filterExportOrders(params)

      if (response.isSuccess && response.data) {
        setData(response.data)
      } else {
        setData({
          total: 0,
          page: currentPage,
          pageSize: pageSize,
          items: [],
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description:
          error.response?.data?.message || 'Không thể tải danh sách đơn xuất hàng',
      })
      setData({
        total: 0,
        page: currentPage,
        pageSize: pageSize,
        items: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page
    fetchOrders()
  }

  const getStatusBadge = (status: number) => {
    const statusConfig = exportStatuses[status] || exportStatuses[0]
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  // Define columns for DataTable
  const columns: DataTableColumn<Record<string, any>>[] = [
    {
      key: 'invoiceNumber',
      header: 'Số hóa đơn',
      cell: (row) => <span className="font-medium">{row.invoiceNumber}</span>,
    },
    {
      key: 'orderDate',
      header: 'Ngày đặt',
      cell: (row) => formatDate(row.orderDate),
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      cell: (row) => row.customerName || `KH-${row.customerId}`,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (row) => getStatusBadge(row.status as unknown as number),
    },
    {
      key: 'totalPayment',
      header: 'Tổng tiền',
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.totalPayment)}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'actions',
      header: 'Thao tác',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/export-orders/${row.exportOrderId}?view=details`)
          }
        >
          <Eye className="mr-1 h-4 w-4" />
          Xem
        </Button>
      ),
      className: 'text-right',
    },
  ]

  // Prepare pagination object
  const paginationConfig: DataTablePagination = {
    currentPage: data.page,
    pageSize: data.pageSize,
    totalItems: data.total,
    totalPages: Math.ceil(data.total / data.pageSize),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
            Đơn Xuất Hàng
          </h1>
          <p className="mt-1 text-gray-500">
            Quản lý đơn xuất hàng cho khách hàng
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/export-orders/new')}
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo Đơn Xuất
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tìm kiếm & Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo số hóa đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {exportStatuses.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* From Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="date"
                placeholder="Từ ngày"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* To Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="date"
                placeholder="Đến ngày"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all')
                setFromDate('')
                setToDate('')
                setSearchQuery('')
                setCurrentPage(1)
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        data={data.items}
        columns={columns}
        keyField="exportOrderId"
        isLoading={isLoading}
        emptyMessage="Không có đơn xuất hàng nào"
        emptyIcon={<Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />}
        pagination={paginationConfig}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        enablePagination={true}
        hoverable={true}
      />
    </div>
  )
}
