'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createImportOrder, getProviders } from '@/services/api/import-orders.api'
import { productApi } from '@/services/api/product.api'
import type { ProductListItem, Provider } from '@/lib/types'
import { Combobox } from '@/components/ui/combobox'

interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  importPrice: number
}

export default function NewImportOrderPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [providerId, setProviderId] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)

  useEffect(() => {
    fetchProducts()
    fetchProviders()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const data = await productApi.listPaged({ pageSize: 1000, isActive: true })
      setProducts(data.items || [])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm',
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchProviders = async () => {
    try {
      setIsLoadingProviders(true)
      const data = await getProviders()
      setProviders(data)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách nhà cung cấp',
      })
    } finally {
      setIsLoadingProviders(false)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        productId: 0,
        productName: '',
        quantity: 1,
        importPrice: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          
          // Auto-fill product name when product is selected
          if (field === 'productId') {
            const product = products.find((p) => p.productId === Number(value))
            if (product) {
              updated.productName = product.name
            }
          }
          
          return updated
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!providerId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn nhà cung cấp',
      })
      return
    }

    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất một sản phẩm',
      })
      return
    }

    const invalidItems = items.filter(
      (item) => !item.productId || item.quantity <= 0 || item.importPrice < 0
    )

    if (invalidItems.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin sản phẩm (số lượng > 0, giá nhập ≥ 0)',
      })
      return
    }

    try {
      setIsLoading(true)

      const response = await createImportOrder({
        providerId: parseInt(providerId),
        orderDate,
        invoiceNumber: invoiceNumber || '', // Backend sẽ auto-generate nếu empty
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          importPrice: item.importPrice,
        })),
      })

      toast({
        title: 'Thành công',
        description: `Đã tạo đơn nhập hàng #${response.invoiceNumber}`,
      })
      router.push(`/dashboard/import-orders/${response.importOrderId}`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể tạo đơn nhập hàng',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Tạo Đơn Nhập Hàng Mới
          </h1>
          <p className="text-gray-500 mt-1">Thêm thông tin đơn nhập và các sản phẩm</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn nhập hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="providerId">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </Label>
                <Combobox
                  options={providers.map((p) => ({
                    value: p.partnerId.toString(),
                    label: p.name,
                  }))}
                  value={providerId}
                  onValueChange={setProviderId}
                  placeholder="Chọn nhà cung cấp"
                  searchPlaceholder="Tìm kiếm nhà cung cấp..."
                  emptyText="Không tìm thấy nhà cung cấp"
                  disabled={isLoadingProviders}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">
                  Ngày đặt hàng <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Số hóa đơn</Label>
              <Input
                id="invoiceNumber"
                placeholder="Để trống để tự động tạo (IMP-YYYYMMDD-XXXXXX)"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Nếu để trống, hệ thống sẽ tự động sinh số hóa đơn
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sản phẩm nhập</CardTitle>
              <Button
                type="button"
                onClick={addItem}
                disabled={isLoadingProducts}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Sản phẩm</TableHead>
                      <TableHead className="w-32">Số lượng</TableHead>
                      <TableHead className="w-40">Giá nhập</TableHead>
                      <TableHead className="w-40">Thành tiền</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Combobox
                            options={products.map((product) => ({
                              value: product.productId.toString(),
                              label: `${product.name} - ${product.serialNumber}`,
                            }))}
                            value={item.productId ? item.productId.toString() : ''}
                            onValueChange={(value) =>
                              updateItem(item.id, 'productId', Number(value))
                            }
                            placeholder="Chọn sản phẩm"
                            searchPlaceholder="Tìm kiếm sản phẩm..."
                            emptyText="Không tìm thấy sản phẩm"
                            disabled={isLoadingProducts}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, 'quantity', Number(e.target.value))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.importPrice}
                            onChange={(e) =>
                              updateItem(item.id, 'importPrice', Number(e.target.value))
                            }
                            placeholder="VNĐ"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {(item.quantity * item.importPrice).toLocaleString('vi-VN')} ₫
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Tổng số sản phẩm: <strong>{items.length}</strong>
                </span>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {items
                      .reduce((sum, item) => sum + item.quantity * item.importPrice, 0)
                      .toLocaleString('vi-VN')}{' '}
                    ₫
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || items.length === 0}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {isLoading ? 'Đang tạo...' : 'Tạo Đơn Nhập Hàng'}
          </Button>
        </div>
      </form>
    </div>
  )
}
