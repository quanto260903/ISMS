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
import { createExportOrder, addExportDetail } from '@/services/api/export-orders.api'
import { productApi } from '@/services/api/product.api'
import type { ProductListItem } from '@/lib/types'
import { Combobox } from '@/components/ui/combobox'

interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export default function NewExportOrderPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [customerId, setCustomerId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    fetchProducts()
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

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        productId: 0,
        productName: '',
        quantity: 1,
        unitPrice: 0,
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
          
          // Auto-fill product name and price when product is selected
          if (field === 'productId') {
            const product = products.find((p) => p.productId === Number(value))
            if (product) {
              updated.productName = product.name
              updated.unitPrice = product.unitPrice || 0
            }
          }
          
          return updated
        }
        return item
      })
    )
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập mã khách hàng',
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

    // Validate all items have product selected
    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0)
    if (invalidItems.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn sản phẩm và nhập số lượng hợp lệ cho tất cả các dòng',
      })
      return
    }

    try {
      setIsLoading(true)

      // Step 1: Create the export order
      console.log('Creating export order with data:', {
        customerId: Number(customerId),
        invoiceNumber: invoiceNumber || undefined,
        note: note || undefined,
      })

      const orderResponse = await createExportOrder({
        customerId: Number(customerId),
        invoiceNumber: invoiceNumber || '',
        orderDate: new Date().toISOString(),
        currency: 'VND',
        taxRate: 0,
        taxAmount: 0,
        totalPayment: calculateTotal(),
        createdBy: 0,
      })

      console.log('Order response:', orderResponse)

      if (!orderResponse.isSuccess) {
        throw new Error(orderResponse.message || 'Không thể tạo đơn xuất hàng')
      }

      // Backend returns data: null but success, so we need to fetch the latest order
      // or redirect to list page since we don't have the ID
      toast({
        title: 'Thành công',
        description: orderResponse.message || 'Đơn xuất hàng đã được tạo',
      })

      // If we have exportOrderId in response data
      if (orderResponse.data?.exportOrderId) {
        const newExportOrderId = orderResponse.data.exportOrderId
        console.log('New export order ID:', newExportOrderId)

        // Step 2: Add all items to the order
        console.log('Adding items:', items)
        const detailPromises = items.map((item) =>
          addExportDetail(newExportOrderId, {
            productId: item.productId,
            quantity: item.quantity,
          })
        )

        const detailResults = await Promise.all(detailPromises)
        console.log('Detail results:', detailResults)

        router.push(`/dashboard/export-orders/${newExportOrderId}`)
      } else {
        // No ID returned, redirect to list page
        router.push('/dashboard/export-orders')
      }
    } catch (error: any) {
      console.error('Error creating export order:', error)
      console.error('Error response:', error.response)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể tạo đơn xuất hàng',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tạo đơn xuất hàng mới</h1>
            <p className="text-muted-foreground">Thêm thông tin đơn xuất hàng và các sản phẩm</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">
                  Mã khách hàng <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerId"
                  type="number"
                  placeholder="Nhập mã khách hàng"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Số hóa đơn</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Nhập số hóa đơn (tùy chọn)"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                placeholder="Nhập ghi chú (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sản phẩm</CardTitle>
              <Button
                type="button"
                onClick={addItem}
                disabled={isLoadingProducts}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="w-32">Số lượng</TableHead>
                    <TableHead className="w-40">Đơn giá</TableHead>
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
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(item.id, 'unitPrice', Number(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
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
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Tổng cộng:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {calculateTotal().toLocaleString('vi-VN')} đ
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Đang tạo...' : 'Tạo đơn xuất hàng'}
          </Button>
        </div>
      </form>
    </div>
  )
}
