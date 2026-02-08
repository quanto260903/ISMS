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
import { Combobox } from '@/components/ui/combobox'
import { Plus, RotateCcw, Eye, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  getReturnOrders, 
  getReturnStatuses, 
  getReturnReasons 
} from '@/services/api/returns.api'
import type { ReturnOrder, ReturnStatus, ReturnReason } from '@/lib/types'
import { DataTable } from '@/components/data-table'
import type { DataTableColumn } from '@/components/data-table'

export default function ReturnsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<ReturnOrder[]>([])
  const [statuses, setStatuses] = useState<ReturnStatus[]>([])
  const [reasons, setReasons] = useState<ReturnReason[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')
  const [exportOrderId, setExportOrderId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchStatuses()
    fetchReasons()
  }, [])

  useEffect(() => {
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
  }, [searchQuery, statusFilter, reasonFilter, exportOrderId, fromDate, toDate])

  const fetchStatuses = async () => {
    try {
      const response = await getReturnStatuses()
      if (response.isSuccess && response.data) {
        setStatuses(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch return statuses:', error)
      setStatuses([
        { status: 'Pending', count: 0 },
        { status: 'Approved', count: 0 },
        { status: 'Rejected', count: 0 },
        { status: 'Completed', count: 0 },
      ])
    }
  }

  const fetchReasons = async () => {
    try {
      const response = await getReturnReasons()
      if (response.isSuccess && response.data) {
        setReasons(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch return reasons:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await getReturnOrders({
        q: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        exportOrderId: exportOrderId ? parseInt(exportOrderId) : undefined,
        page: currentPage,
        pageSize: pageSize,
      })

      if (response.isSuccess && response.data) {
        setOrders(Array.isArray(response.data) ? response.data : [])
        setTotalItems(response.total || 0)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách đơn trả hàng',
      })
      setOrders([])
      setTotalItems(0)
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // Define columns for DataTable
  const columns: DataTableColumn<ReturnOrder>[] = [
    {
      key: 'returnOrderId',
      header: 'Mã đơn trả',
      cell: (order: ReturnOrder) => (
        <span className="font-medium">#{order.returnOrderId}</span>
      ),
      sortable: true,
    },
    {
      key: 'exportOrderId',
      header: 'Mã đơn xuất',
      cell: (order: ReturnOrder) => `#${order.exportOrderId}`,
      sortable: true,
    },
    {
      key: 'checkInTime',
      header: 'Thời gian nhận',
      cell: (order: ReturnOrder) => formatDate(order.checkInTime),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (order: ReturnOrder) => getStatusBadge(order.status),
    },
    {
      key: 'checkedByName',
      header: 'Người kiểm tra',
      cell: (order: ReturnOrder) => order.checkedByName || '-',
    },
    {
      key: 'reviewedByName',
      header: 'Người duyệt',
      cell: (order: ReturnOrder) => order.reviewedByName || '-',
    },
    {
      key: 'note',
      header: 'Ghi chú',
      cell: (order: ReturnOrder) => (
        <span className="max-w-xs truncate block">{order.note || '-'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
            Đơn Trả Hàng
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý đơn trả hàng từ khách hàng
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/returns/new')}
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo Đơn Trả Hàng
        </Button>
      </div>

      {/* Filter Section */}
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
                  {statuses.map((item, index) => (
                    <SelectItem key={index} value={item.status}>
                      {item.status === 'Pending' ? 'Chờ xử lý' : 
                       item.status === 'Approved' ? 'Đã duyệt' :
                       item.status === 'Rejected' ? 'Từ chối' :
                       item.status === 'Completed' ? 'Hoàn thành' : 
                       item.status} ({item.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do trả hàng</label>
              <Combobox
                options={[
                  { value: 'all', label: 'Tất cả lý do' },
                  ...reasons.map((reason) => ({
                    value: reason.reasonCode,
                    label: `${reason.description} (${reason.reasonCode})`,
                  })),
                ]}
                value={reasonFilter}
                onValueChange={setReasonFilter}
                placeholder="Chọn lý do trả hàng"
                searchPlaceholder="Tìm kiếm lý do..."
                emptyText="Không tìm thấy lý do"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mã đơn xuất</label>
              <Input
                type="number"
                placeholder="Nhập mã đơn xuất"
                value={exportOrderId}
                onChange={(e) => setExportOrderId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                placeholder="Từ ngày"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                placeholder="Đến ngày"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Action</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter('all')
                  setReasonFilter('all')
                  setExportOrderId('')
                  setFromDate('')
                  setToDate('')
                  setSearchQuery('')
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        data={orders}
        columns={columns}
        keyField="returnOrderId"
        isLoading={isLoading}
        emptyMessage="Không có đơn trả hàng nào"
        emptyIcon={<RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
        searchable
        searchPlaceholder="Tìm kiếm theo mã đơn, ghi chú..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortable
        pagination={{
          currentPage,
          pageSize,
          totalItems: totalItems,
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
            onClick: (order: ReturnOrder) =>
              router.push(`/dashboard/returns/${order.returnOrderId}`),
            variant: 'ghost',
          },
        ]}
        onRowClick={(order: ReturnOrder) =>
          router.push(`/dashboard/returns/${order.returnOrderId}`)
        }
        hoverable
        striped
      />
    </div>
  )
}
