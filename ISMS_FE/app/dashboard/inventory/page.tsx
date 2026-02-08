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
import {
  Search,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Box,
  Boxes,
  PackageX,
  Truck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getProductInventoryList,
  getInventoryDashboard,
  getInventoryStatusSummary,
} from '@/services/api/inventory.api'
import type {
  ProductInventoryDto,
  InventoryDashboardDto,
  InventoryStatusSummaryDto,
} from '@/lib/types/inventory.types'
import { DataTable } from '@/components/data-table'
import type { DataTableColumn } from '@/components/data-table/types'

export default function InventoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<ProductInventoryDto[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductInventoryDto[]>([])
  const [dashboard, setDashboard] = useState<InventoryDashboardDto | null>(null)
  const [statusSummary, setStatusSummary] = useState<InventoryStatusSummaryDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, stockFilter, products])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const [productsData, dashboardData, summaryData] = await Promise.all([
        getProductInventoryList(),
        getInventoryDashboard(),
        getInventoryStatusSummary(),
      ])

      setProducts(productsData)
      setFilteredProducts(productsData)
      setDashboard(dashboardData)
      setStatusSummary(summaryData)
    } catch (error: any) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu tồn kho',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productId.toString().includes(searchQuery)
      )
    }

    // Stock status filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter((product) => {
        switch (stockFilter) {
          case 'available':
            return product.available > 0
          case 'low':
            return product.available > 0 && product.available < 10 // Low stock threshold
          case 'out':
            return product.available === 0
          case 'allocated':
            return product.allocated > 0
          case 'damaged':
            return product.damaged > 0
          case 'in-transit':
            return product.inTransit > 0
          default:
            return true
        }
      })
    }

    setFilteredProducts(filtered)
  }

  const handleReset = () => {
    setSearchQuery('')
    setStockFilter('all')
  }

  const getStockStatusBadge = (product: ProductInventoryDto) => {
    if (product.available === 0) {
      return <Badge variant="destructive">Hết hàng</Badge>
    } else if (product.available < 10) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Sắp hết</Badge>
    } else {
      return <Badge variant="default" className="bg-green-500">Còn hàng</Badge>
    }
  }

  // Define columns for DataTable
  const columns: DataTableColumn<ProductInventoryDto>[] = [
    {
      key: 'productId',
      header: 'ID',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <span className="font-mono text-sm text-gray-600">#{product.productId}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Tên sản phẩm',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{product.productName}</span>
        </div>
      ),
    },
    {
      key: 'totalStock',
      header: 'Tổng tồn',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <span className="font-semibold">{product.totalStock.toLocaleString()}</span>
      ),
    },
    {
      key: 'available',
      header: 'Khả dụng',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-green-500" />
          <span className="text-green-700 font-medium">{product.available.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'allocated',
      header: 'Đã phân bổ',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-blue-500" />
          <span className="text-blue-700">{product.allocated.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'damaged',
      header: 'Hư hỏng',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4 text-red-500" />
          <span className="text-red-700">{product.damaged.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'inTransit',
      header: 'Đang vận chuyển',
      sortable: true,
      cell: (product: ProductInventoryDto) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-orange-500" />
          <span className="text-orange-700">{product.inTransit.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (product: ProductInventoryDto) => getStockStatusBadge(product),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tồn Kho</h1>
          <p className="text-gray-500 mt-1">Theo dõi và quản lý tồn kho sản phẩm</p>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng giá trị tồn kho
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard?.totalStockValue.toLocaleString() || '0'} ₫
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sản phẩm sắp hết
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboard?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sản phẩm hết hàng
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboard?.outOfStockCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vòng quay tồn kho
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard?.inventoryTurnoverRate.toFixed(1) || '0'} lần/tháng
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      {statusSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ trạng thái tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Box className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Khả dụng</p>
                  <p className="text-xl font-bold text-green-600">
                    {statusSummary.available.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Boxes className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Đã phân bổ</p>
                  <p className="text-xl font-bold text-blue-600">
                    {statusSummary.allocated.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PackageX className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Hư hỏng</p>
                  <p className="text-xl font-bold text-red-600">
                    {statusSummary.damaged.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Đang vận chuyển</p>
                  <p className="text-xl font-bold text-orange-600">
                    {statusSummary.inTransit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc ID sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="available">Còn hàng</SelectItem>
                <SelectItem value="low">Sắp hết</SelectItem>
                <SelectItem value="out">Hết hàng</SelectItem>
                <SelectItem value="allocated">Đã phân bổ</SelectItem>
                <SelectItem value="damaged">Hư hỏng</SelectItem>
                <SelectItem value="in-transit">Đang vận chuyển</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách sản phẩm ({filteredProducts.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredProducts}
            columns={columns}
            keyField="productId"
            isLoading={isLoading}
            emptyMessage="Không có sản phẩm nào"
          />
        </CardContent>
      </Card>
    </div>
  )
}
