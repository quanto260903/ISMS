'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { productApi } from '@/services/api/product.api'
import type { Product } from '@/lib/types'
import Image from 'next/image'
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

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const productId = Number(params.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setIsLoading(true)
      const response = await productApi.getById(productId)

      if (response.isSuccess && response.data) {
        setProduct(response.data)
      } else {
        throw new Error(response.message || 'Không tìm thấy sản phẩm')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể tải thông tin sản phẩm',
      })
      router.push('/dashboard/products-list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await productApi.delete(productId)

      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: response.message || 'Xóa sản phẩm thành công',
        })
        router.push('/dashboard/products-list')
      } else {
        throw new Error(response.message || 'Không thể xóa sản phẩm')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể xóa sản phẩm',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
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

  const getExpiryStatus = (expiredDate?: string) => {
    if (!expiredDate) return { label: 'Không xác định', variant: 'outline' as const }
    
    const today = new Date()
    const expiryDate = new Date(expiredDate)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { label: 'Đã hết hạn', variant: 'destructive' as const }
    } else if (daysUntilExpiry <= 30) {
      return { label: `Còn ${daysUntilExpiry} ngày`, variant: 'default' as const }
    } else {
      return { label: 'Còn hạn', variant: 'secondary' as const }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Không tìm thấy sản phẩm</h3>
      </div>
    )
  }

  const expiryStatus = getExpiryStatus(product.expiredDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.serialNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/products-list/${productId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Image */}
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            {product.image ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mã sản phẩm</p>
                <p className="font-medium">{product.serialNumber}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Đơn vị</p>
                <p className="font-medium">{product.unit || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Giá mua</p>
                <p className="font-medium">{formatCurrency(product.purchasedPrice)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Giá bán</p>
                <p className="font-medium">{formatCurrency(product.unitPrice)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ngày nhập kho</p>
                <p className="font-medium">{formatDate(product.receivedDate)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Hạn sử dụng</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{formatDate(product.expiredDate)}</p>
                  <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Điểm đặt hàng lại</p>
                <p className="font-medium">{product.reorderPoint || '-'}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Mô tả</p>
                <p className="font-medium">{product.description || 'Không có mô tả'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{product.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
