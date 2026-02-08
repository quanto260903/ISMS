'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Eye, Edit, AlertCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { productApi } from '@/services/api/product.api'
import type { ProductListItem } from '@/lib/types'
import Image from 'next/image'
import { DataTable } from '@/components/data-table'
import type { DataTableColumn } from '@/components/data-table'

export default function ProductsListPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [currentPage, pageSize])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchProducts()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching products with params:', {
        q: searchQuery || undefined,
        page: currentPage,
        pageSize,
      })

      const response = await productApi.listPaged({
        q: searchQuery || undefined,
        page: currentPage,
        pageSize,
      })

      console.log('API Response:', response)

      // API trả về trực tiếp object với structure: { total, page, pageSize, items }
      if (response && response.items) {
        setProducts(response.items || [])
        setTotalItems(response.total || 0)
        setTotalPages(Math.ceil((response.total || 0) / pageSize))
      } else {
        console.error('Invalid API response structure:', response)
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Dữ liệu trả về không đúng định dạng',
        })
      }
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể tải danh sách sản phẩm',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const isNearExpiry = (expiryDate?: string) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 && diffDays > 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null
    
    if (isExpired(expiryDate)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Hết hạn
        </Badge>
      )
    }
    
    if (isNearExpiry(expiryDate)) {
      return (
        <Badge className="bg-orange-500 gap-1">
          <AlertCircle className="h-3 w-3" />
          Sắp hết hạn
        </Badge>
      )
    }
    
    return null
  }

  // Define columns for DataTable
  const columns: DataTableColumn<ProductListItem>[] = [
    {
      key: 'image',
      header: 'Hình ảnh',
      cell: (product: ProductListItem) => (
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (product.image) {
              setSelectedImage({ url: product.image, name: product.name })
            }
          }}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={48}
              height={48}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      ),
      className: 'w-20',
    },
    {
      key: 'serialNumber',
      header: 'Mã SP',
      cell: (product: ProductListItem) => (
        <span className="font-mono text-sm">{product.serialNumber}</span>
      ),
      sortable: true,
    },
    {
      key: 'name',
      header: 'Tên sản phẩm',
      cell: (product: ProductListItem) => (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          {product.categoryName && (
            <span className="text-xs text-gray-500">{product.categoryName}</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'unit',
      header: 'Đơn vị',
      cell: (product: ProductListItem) => product.unit,
    },
    {
      key: 'unitPrice',
      header: 'Đơn giá',
      cell: (product: ProductListItem) => (
        <span className="font-medium">{formatCurrency(product.unitPrice)}</span>
      ),
      className: 'text-right',
      headerClassName: 'text-right',
      sortable: true,
    },
    {
      key: 'receivedDate',
      header: 'Ngày nhận',
      cell: (product: ProductListItem) => formatDate(product.receivedDate),
      sortable: true,
    },
    {
      key: 'expiredDate',
      header: 'Hạn sử dụng',
      cell: (product: ProductListItem) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{formatDate(product.expiredDate)}</span>
          {getExpiryBadge(product.expiredDate)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      cell: (product: ProductListItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/products-list/${product.productId}`)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/products-list/${product.productId}/edit`)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-32',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-gray-500 mt-1">
            Danh sách sản phẩm trong kho
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/products-list/new')}
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Sản Phẩm
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={products}
        columns={columns}
        keyField="productId"
        isLoading={isLoading}
        emptyMessage="Không tìm thấy sản phẩm nào"
        emptyIcon={<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
        searchable
        searchPlaceholder="Tìm kiếm theo tên sản phẩm, mã sản phẩm..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortable
        pagination={{
          currentPage,
          pageSize,
          totalItems,
          totalPages,
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
            onClick: (product: ProductListItem) => router.push(`/dashboard/products-list/${product.productId}`),
            variant: 'ghost',
          },
          {
            label: 'Sửa',
            icon: <Edit className="h-4 w-4 mr-1" />,
            onClick: (product: ProductListItem) => router.push(`/dashboard/products-list/${product.productId}/edit`),
            variant: 'ghost',
          },
        ]}
        onRowClick={(product: ProductListItem) => router.push(`/dashboard/products-list/${product.productId}`)}
        hoverable
        striped
      />

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[500px]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
