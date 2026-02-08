# 📦 Module Tồn Kho (Inventory) - Hướng Dẫn

## 📋 Tổng Quan

Module quản lý tồn kho đã được cập nhật với API mới và thiết kế UI hiện đại theo concept của các module Import/Export Orders.

### ✨ Tính Năng

- ✅ Dashboard metrics: Giá trị tồn kho, sản phẩm sắp hết, hết hàng, vòng quay tồn kho
- ✅ Phân bổ trạng thái: Khả dụng, Đã phân bổ, Hư hỏng, Đang vận chuyển
- ✅ Danh sách sản phẩm với DataTable component
- ✅ Tìm kiếm theo tên hoặc ID sản phẩm
- ✅ Lọc theo trạng thái: Còn hàng, Sắp hết, Hết hàng, etc.
- ✅ Sorting theo các cột
- ✅ Badge trạng thái với màu sắc trực quan

## 🏗️ Cấu Trúc Files

```
SWS_FE/
├── lib/types/
│   └── inventory.types.ts           # TypeScript interfaces
├── services/api/
│   └── inventory.api.ts              # API service functions
└── app/dashboard/inventory/
    └── page.tsx                      # Main inventory page
```

## 📡 API Endpoints

### 1. GET /api/inventory/products (Main)
**Mô tả:** Lấy danh sách sản phẩm kèm thông tin tồn kho

**Response:**
```typescript
[
  {
    productId: 1,
    productName: "Laptop Dell XPS 13",
    totalStock: 150,
    available: 100,
    allocated: 30,
    damaged: 10,
    inTransit: 10
  }
]
```

### 2. GET /api/inventory/dashboard
**Mô tả:** Lấy thông tin tổng quan dashboard

**Response:**
```typescript
{
  totalStockValue: 1500000,
  lowStockCount: 5,
  outOfStockCount: 2,
  inventoryTurnoverRate: 3.5
}
```

### 3. GET /api/inventory/status-summary
**Mô tả:** Thống kê tồn kho theo trạng thái

**Response:**
```typescript
{
  available: 1000,
  allocated: 200,
  damaged: 50,
  inTransit: 100
}
```

### 4. GET /api/inventory/All
**Mô tả:** Lấy danh sách tất cả các bản ghi inventory

### 5. GET /api/inventory/{inventoryId}
**Mô tả:** Lấy chi tiết inventory theo ID

### 6. GET /api/inventory/productId/{productId}
**Mô tả:** Lấy inventory của một sản phẩm cụ thể

### 7. POST /api/inventory
**Mô tả:** Thêm inventory mới

**Body:**
```typescript
{
  productId: 1,
  locationId: 2,
  quantityAvailable: 100,
  allocatedQuantity: 0
}
```

### 8. PUT /api/inventory/{inventoryId}
**Mô tả:** Cập nhật inventory

**Body:**
```typescript
{
  quantityAvailable: 120,
  allocatedQuantity: 10
}
```

### 9. DELETE /api/inventory/{inventoryId}
**Mô tả:** Xóa inventory

## 🎨 UI Components

### Dashboard Metrics Cards

4 cards hiển thị thông tin tổng quan:
- **Tổng giá trị tồn kho** (màu xanh)
- **Sản phẩm sắp hết** (màu vàng)
- **Sản phẩm hết hàng** (màu đỏ)
- **Vòng quay tồn kho** (màu xanh lá)

### Status Summary Card

Hiển thị phân bổ trạng thái với icons:
- 📦 **Khả dụng** - Box icon (xanh lá)
- 📦📦 **Đã phân bổ** - Boxes icon (xanh dương)
- ❌ **Hư hỏng** - PackageX icon (đỏ)
- 🚚 **Đang vận chuyển** - Truck icon (cam)

### Filters

- **Search input:** Tìm kiếm theo tên hoặc ID sản phẩm
- **Status dropdown:** Lọc theo trạng thái
  - Tất cả
  - Còn hàng
  - Sắp hết
  - Hết hàng
  - Đã phân bổ
  - Hư hỏng
  - Đang vận chuyển
- **Reset button:** Đặt lại tất cả bộ lọc

### DataTable

Bảng danh sách với các cột:
1. **ID** - Product ID (font-mono, gray)
2. **Tên sản phẩm** - Với Package icon
3. **Tổng tồn** - Tổng số lượng
4. **Khả dụng** - Với Box icon (xanh lá)
5. **Đã phân bổ** - Với Boxes icon (xanh dương)
6. **Hư hỏng** - Với PackageX icon (đỏ)
7. **Đang vận chuyển** - Với Truck icon (cam)
8. **Trạng thái** - Badge với màu sắc:
   - 🔴 Hết hàng (destructive)
   - 🟡 Sắp hết (outline yellow)
   - 🟢 Còn hàng (green)

## 🔧 Usage Examples

### Trong Component

```tsx
import {
  getProductInventoryList,
  getInventoryDashboard,
  getInventoryStatusSummary,
} from '@/services/api/inventory.api'

// Fetch data
const [productsData, dashboardData, summaryData] = await Promise.all([
  getProductInventoryList(),
  getInventoryDashboard(),
  getInventoryStatusSummary(),
])
```

### Filter Logic

```tsx
// Search filter
if (searchQuery) {
  filtered = filtered.filter((product) =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productId.toString().includes(searchQuery)
  )
}

// Stock status filter
switch (stockFilter) {
  case 'available':
    return product.available > 0
  case 'low':
    return product.available > 0 && product.available < 10
  case 'out':
    return product.available === 0
  // ...
}
```

### Status Badge

```tsx
const getStockStatusBadge = (product: ProductInventoryDto) => {
  if (product.available === 0) {
    return <Badge variant="destructive">Hết hàng</Badge>
  } else if (product.available < 10) {
    return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Sắp hết</Badge>
  } else {
    return <Badge variant="default" className="bg-green-500">Còn hàng</Badge>
  }
}
```

## 🎯 Customization

### Thay đổi ngưỡng "Sắp hết"

```tsx
// Trong filter logic và badge logic
const LOW_STOCK_THRESHOLD = 10 // Đổi thành 20, 30, etc.

// Filter
case 'low':
  return product.available > 0 && product.available < LOW_STOCK_THRESHOLD

// Badge
else if (product.available < LOW_STOCK_THRESHOLD) {
  return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Sắp hết</Badge>
}
```

### Thêm filter mới

```tsx
// Trong Select component
<SelectContent>
  <SelectItem value="all">Tất cả</SelectItem>
  {/* ... existing options */}
  <SelectItem value="high-stock">Tồn kho cao (>100)</SelectItem>
</SelectContent>

// Trong filter logic
case 'high-stock':
  return product.totalStock > 100
```

### Thay đổi màu sắc cards

```tsx
// Dashboard Metrics
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-gray-600">
      Tổng giá trị tồn kho
    </CardTitle>
    <TrendingUp className="h-4 w-4 text-purple-500" /> {/* Đổi từ blue-500 */}
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-purple-600"> {/* Đổi từ blue-600 */}
      {dashboard?.totalStockValue.toLocaleString() || '0'} ₫
    </div>
  </CardContent>
</Card>
```

## 📊 Data Flow

```
User visits /dashboard/inventory
         ↓
Component mounts
         ↓
Fetch data (parallel):
- getProductInventoryList()
- getInventoryDashboard()
- getInventoryStatusSummary()
         ↓
Set state:
- products[]
- dashboard{}
- statusSummary{}
         ↓
Apply filters (searchQuery, stockFilter)
         ↓
Display filtered data in DataTable
```

## 🐛 Troubleshooting

### Issue: Không load được data

**Kiểm tra:**
```tsx
// Browser console
console.log('Products:', products)
console.log('Dashboard:', dashboard)
console.log('Status Summary:', statusSummary)
```

**Giải pháp:**
- Check backend đang chạy
- Check API endpoints đúng
- Check JWT token hợp lệ

### Issue: Filter không hoạt động

**Kiểm tra:**
```tsx
console.log('Search Query:', searchQuery)
console.log('Stock Filter:', stockFilter)
console.log('Filtered Products:', filteredProducts)
```

**Giải pháp:**
- Verify useEffect dependencies
- Check filter logic trong applyFilters()

### Issue: DataTable không hiển thị

**Kiểm tra:**
```tsx
// Verify keyField
<DataTable
  data={filteredProducts}
  columns={columns}
  keyField="productId" // Must match ProductInventoryDto property
  isLoading={isLoading}
/>
```

## 🚀 Future Enhancements

### 1. Export to Excel
```tsx
import { exportInventoryToExcel } from '@/services/api/inventory.api'

const handleExport = async () => {
  await exportInventoryToExcel(filteredProducts)
}
```

### 2. Bulk Actions
```tsx
<DataTable
  selectable
  bulkActions={[
    {
      label: 'Cập nhật tồn kho',
      onClick: (selected) => handleBulkUpdate(selected)
    }
  ]}
/>
```

### 3. Detail Page
```tsx
// app/dashboard/inventory/[id]/page.tsx
const InventoryDetailPage = ({ params }) => {
  const { id } = params
  // Fetch inventory detail
  const inventory = await getInventoryById(id)
  // Display detail view
}
```

### 4. Real-time Updates
```tsx
// Integrate with SignalR for real-time inventory updates
notificationManager.onInventoryUpdate((update) => {
  // Update local state
  setProducts(prev => updateProduct(prev, update))
})
```

## 📝 Notes

- ⚠️ API có 2 endpoints trùng chức năng: `/products` và `/product-inventory`. Hiện tại dùng `/products`
- 💾 LocalStorage không được sử dụng (khác với orders)
- 🔄 Data được fetch lại mỗi khi component mount
- 🎨 UI design theo concept của Import/Export Orders
- 📊 DataTable component được reuse từ data-table/

---

**Module hoàn chỉnh và sẵn sàng sử dụng! 🎉**
