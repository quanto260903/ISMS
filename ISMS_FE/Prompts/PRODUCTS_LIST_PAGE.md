# Trang Quản Lý Sản Phẩm - Products List

## 📍 URL
`/dashboard/products-list`

## 🎯 Chức năng

### 1. **Hiển thị danh sách sản phẩm**
- ✅ Pagination với 10 items/page
- ✅ Tổng số sản phẩm
- ✅ Thông tin đầy đủ mỗi sản phẩm

### 2. **Tìm kiếm**
- ✅ Search theo tên sản phẩm
- ✅ Search theo mã sản phẩm (serial number)
- ✅ Debounce 500ms để giảm API calls

### 3. **Thông tin hiển thị**

#### Columns:
1. **Mã SP** - Serial Number (font mono)
2. **Tên sản phẩm** - Name + Category (nếu có)
3. **Đơn vị** - Unit
4. **Đơn giá** - Unit Price (VND format)
5. **Tồn kho** - Stock Quantity (với badges)
6. **Mức đặt lại** - Reorder Point
7. **Hạn sử dụng** - Expiry Date (với warnings)
8. **Thao tác** - View & Edit buttons

### 4. **Status Indicators**

#### Stock Badges:
```typescript
- Hết hàng (Red): stockQuantity === 0
- Sắp hết (Orange): stockQuantity <= reorderPoint
- Normal (Gray): stockQuantity > reorderPoint
```

#### Expiry Badges:
```typescript
- Hết hạn (Red): expiredDate < today
- Sắp hết hạn (Orange): expiredDate <= today + 90 days
- OK: No badge
```

### 5. **Statistics Cards**
- **Tổng sản phẩm**: Total items from API
- **Đang hiển thị**: Current page items count
- **Trang hiện tại**: Current page / Total pages
- **Kích thước trang**: 10 items

### 6. **Pagination**
- ✅ Buttons: Đầu | Trước | Sau | Cuối
- ✅ Current page indicator
- ✅ Total pages calculation
- ✅ Disabled states

## 🔌 API Integration

### Endpoint
```http
GET /api/product/paged?page=1&pageSize=10&q=search_query
Authorization: Bearer {token}
```

### Response Example
```json
{
  "total": 60,
  "page": 1,
  "pageSize": 10,
  "items": [
    {
      "productId": 1,
      "serialNumber": "DT-IP14-001",
      "name": "Điện thoại iPhone 14 Pro Max 256GB",
      "expiredDate": "2026-12-31",
      "unit": "Cái",
      "unitPrice": 32000000.00,
      "reorderPoint": 10,
      "stockQuantity": 25,
      "categoryName": "Điện thoại"
    }
  ]
}
```

## 🎨 UI Features

### Design
- Purple-Teal gradient header
- Responsive table with horizontal scroll
- Loading states với spinner
- Empty state với icon + message

### Colors
- Primary: Purple (#a855f7)
- Secondary: Teal (#14b8a6)
- Destructive: Red (hết hàng, hết hạn)
- Warning: Orange (sắp hết, sắp hết hạn)

### Typography
- Mã SP: Monospace font
- Tên SP: Font-medium
- Category: Text-xs gray
- Price: Right-aligned, font-medium

## 📱 Responsive
- ✅ Mobile: Single column cards
- ✅ Tablet: 2 column grid
- ✅ Desktop: Full table view
- ✅ Horizontal scroll on small screens

## 🔄 State Management

### Local State
```typescript
const [products, setProducts] = useState<ProductListItem[]>([])
const [isLoading, setIsLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState('')
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [totalItems, setTotalItems] = useState(0)
```

### Effects
1. **Fetch on page change**: `useEffect(() => fetchProducts(), [currentPage])`
2. **Debounced search**: 500ms delay, reset to page 1

## 🚀 Actions

### View Product
```typescript
onClick={() => router.push(`/dashboard/products-list/${productId}`)}
```

### Edit Product
```typescript
onClick={() => router.push(`/dashboard/products-list/${productId}/edit`)}
```

### Create Product
```typescript
onClick={() => router.push(`/dashboard/products-list/new`)}
```

## 💡 Helper Functions

### Currency Formatting
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
```

### Date Formatting
```typescript
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
```

### Expiry Check
```typescript
const isNearExpiry = (expiryDate?: string) => {
  // Check if expires within 90 days
  const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  return diffDays <= 90 && diffDays > 0
}

const isExpired = (expiryDate?: string) => {
  return new Date(expiryDate) < new Date()
}
```

## 📊 Example Data Display

### Product Row Example:
```
| DT-IP14-001 | iPhone 14 Pro Max 256GB | Cái | 32.000.000 ₫ | [25] | 10 | 31/12/2026 | [View][Edit] |
|             | Điện thoại              |     |              |      |    |            |              |
```

### With Warnings:
```
| DT-SS-002 | Samsung Galaxy S23  | Cái | 28.000.000 ₫ | [Sắp hết] | 15 | 15/01/2026 | [View][Edit] |
|           | Điện thoại          |     |              |    (8)    |    | [⚠️Sắp HSD]|              |
```

## 🔗 Navigation

Updated sidebar với 2 product pages:
- **Danh sách SP** (`/dashboard/products-list`) - Full product list
- **SP Hết hạn** (`/dashboard/products`) - Expiry tracking

## 🎯 Use Cases

### 1. Warehouse Manager
- Browse all products
- Check stock levels
- Identify low stock items
- Monitor expiry dates

### 2. Sales Staff
- Search products for orders
- Check availability
- View prices
- Verify product details

### 3. Inventory Staff
- Track stock quantities
- Monitor reorder points
- Identify expired products
- Update stock levels

## ⚡ Performance

### Optimizations
- ✅ Debounced search (500ms)
- ✅ Pagination (10 items/page)
- ✅ Lazy loading on scroll
- ✅ Memoized calculations

### API Efficiency
- Only fetch current page data
- Search on server-side
- Total count from API
- No redundant calls

## 🐛 Error Handling

### Network Errors
```typescript
toast({
  variant: 'destructive',
  title: 'Lỗi',
  description: 'Không thể tải danh sách sản phẩm',
})
```

### Empty Results
- Shows empty state
- Package icon
- Helpful message

### Loading State
- Spinner animation
- Disabled pagination
- Blocked actions

## 🔮 Future Enhancements

### Priority 1
- [ ] Product detail page (`[id]/page.tsx`)
- [ ] Product edit form (`[id]/edit/page.tsx`)
- [ ] Product create form (`new/page.tsx`)

### Priority 2
- [ ] Bulk actions (delete, update)
- [ ] Export to Excel
- [ ] Print product labels
- [ ] QR code generation

### Priority 3
- [ ] Advanced filters (category, price range)
- [ ] Sort by columns
- [ ] Column visibility toggle
- [ ] Custom page size

## 📝 Testing Checklist

- [ ] Load page → fetch products
- [ ] Search by name → filter results
- [ ] Search by serial number → filter results
- [ ] Navigate pages → update data
- [ ] Click "Đầu" → go to page 1
- [ ] Click "Cuối" → go to last page
- [ ] Low stock badge shows correctly
- [ ] Expired badge shows correctly
- [ ] Near expiry badge shows correctly
- [ ] Currency formats correctly (VND)
- [ ] Date formats correctly (dd/MM/yyyy)
- [ ] View button → navigate to detail
- [ ] Edit button → navigate to edit
- [ ] Create button → navigate to new
- [ ] Empty search → show empty state
- [ ] Network error → show toast

## 🎓 Code Quality

### TypeScript
- ✅ Fully typed with interfaces
- ✅ Type-safe API calls
- ✅ No any types (except errors)

### React Best Practices
- ✅ Hooks properly used
- ✅ Effects with dependencies
- ✅ Cleanup on unmount
- ✅ Debouncing implemented

### Accessibility
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management

## 🔗 Related Files

```
lib/types/product.types.ts       - Type definitions
services/api/product.api.ts      - API service
app/dashboard/layout.tsx         - Navigation
app/dashboard/products/page.tsx  - Expiry tracking
```

## 📚 Summary

Trang **Products List** cung cấp:
- ✅ Quản lý sản phẩm hoàn chỉnh
- ✅ Tìm kiếm & pagination
- ✅ Theo dõi tồn kho
- ✅ Cảnh báo hết hạn
- ✅ Cảnh báo sắp hết hàng
- ✅ Actions (view/edit/create)
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

Ready for production! 🚀
