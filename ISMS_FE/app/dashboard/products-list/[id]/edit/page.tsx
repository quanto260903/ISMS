'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { productApi } from '@/services/api/product.api'
import { uploadFile, deleteFile, extractPublicIdFromUrl } from '@/services/api/cloudinary.api'
import type { Product } from '@/lib/types'
import Image from 'next/image'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const productId = Number(params.id)

  const [formData, setFormData] = useState({
    name: '',
    expiredDate: '',
    unit: '',
    unitPrice: '',
    receivedDate: '',
    purchasedPrice: '',
    reorderPoint: '',
    image: '',
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [oldImageUrl, setOldImageUrl] = useState<string>('')

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setIsFetching(true)
      const response = await productApi.getById(productId)

      if (response.isSuccess && response.data) {
        const product = response.data
        setFormData({
          name: product.name || '',
          expiredDate: product.expiredDate || '',
          unit: product.unit || '',
          unitPrice: product.unitPrice?.toString() || '',
          receivedDate: product.receivedDate || '',
          purchasedPrice: product.purchasedPrice?.toString() || '',
          reorderPoint: product.reorderPoint?.toString() || '',
          image: product.image || '',
          description: product.description || '',
        })
        setOldImageUrl(product.image || '')
        setImagePreview(product.image || '')
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
      setIsFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)',
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'File ảnh không được vượt quá 10MB',
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.expiredDate || !formData.receivedDate) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các trường bắt buộc',
      })
      return
    }

    try {
      setIsLoading(true)
      let imageUrl = formData.image

      // Step 1: Nếu có ảnh mới, upload lên Cloudinary
      if (imageFile) {
        setIsUploading(true)

        // Upload ảnh mới
        const uploadResponse = await uploadFile(imageFile, 'products')

        if (uploadResponse.isSuccess && uploadResponse.data) {
          imageUrl = uploadResponse.data.secureUrl

          // Xóa ảnh cũ nếu có
          if (oldImageUrl) {
            const oldPublicId = extractPublicIdFromUrl(oldImageUrl)
            if (oldPublicId) {
              try {
                await deleteFile(oldPublicId)
              } catch (error) {
                console.error('Failed to delete old image:', error)
                // Không throw error vì ảnh mới đã upload thành công
              }
            }
          }
        } else {
          throw new Error(uploadResponse.message || 'Không thể upload ảnh')
        }
        setIsUploading(false)
      }

      // Step 2: Update sản phẩm
      const response = await productApi.update(productId, {
        name: formData.name,
        expiredDate: formData.expiredDate,
        unit: formData.unit || undefined,
        unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
        receivedDate: formData.receivedDate,
        purchasedPrice: formData.purchasedPrice ? Number(formData.purchasedPrice) : undefined,
        reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : undefined,
        image: imageUrl || undefined,
        description: formData.description || undefined,
      })

      if (response.isSuccess) {
        toast({
          title: 'Thành công',
          description: response.message || 'Cập nhật sản phẩm thành công',
        })
        router.push('/dashboard/products-list')
      } else {
        throw new Error(response.message || 'Không thể cập nhật sản phẩm')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response?.data?.message || error.message || 'Không thể cập nhật sản phẩm',
      })
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa sản phẩm</h1>
          <p className="text-muted-foreground">Cập nhật thông tin sản phẩm</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nhập tên sản phẩm"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị tính</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="Cái, Hộp, Chai..."
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">
                  Ngày nhập kho <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receivedDate"
                  name="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiredDate">
                  Ngày hết hạn <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expiredDate"
                  name="expiredDate"
                  type="date"
                  value={formData.expiredDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasedPrice">Giá mua (VNĐ)</Label>
                <Input
                  id="purchasedPrice"
                  name="purchasedPrice"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="1000000"
                  value={formData.purchasedPrice}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Giá bán (VNĐ)</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="1500000"
                  value={formData.unitPrice}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Điểm đặt hàng lại</Label>
                <Input
                  id="reorderPoint"
                  name="reorderPoint"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Hình ảnh sản phẩm</Label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      {imageFile && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        id="imageFile"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="imageFile"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-10 w-10 text-gray-400" />
                        <div className="text-sm">
                          <span className="text-purple-600 font-medium">
                            {imagePreview ? 'Thay đổi ảnh' : 'Chọn file ảnh'}
                          </span>
                          <span className="text-gray-500"> hoặc kéo thả vào đây</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF, WebP (tối đa 10MB)
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Nhập mô tả sản phẩm..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isUploading ? 'Đang upload ảnh...' : isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
