# Hướng dẫn sử dụng các trang UI đã tạo

## 📋 Tổng quan

Đã tạo hoàn chỉnh các trang UI và API services cho hệ thống quản lý kho bao gồm:
- Import Orders (Đơn Nhập Hàng)
- Export Orders (Đơn Xuất Hàng) 
- Return Orders (Đơn Trả Hàng)
- Products (Sản Phẩm) với thông báo hết hạn

## 🗂️ Cấu trúc Files đã tạo

### Types (lib/types/)
```
lib/types/
├── order.types.ts      # Import/Export Order types
├── return.types.ts     # Return Order types
├── product.types.ts    # Product types
└── index.ts           # Central export (đã cập nhật)
```

### API Services (services/api/)
```
services/api/
├── order.api.ts       # Import/Export Order APIs
├── return.api.ts      # Return Order APIs
└── product.api.ts     # Product APIs
```

### UI Pages (app/dashboard/)
```
app/dashboard/
├── import-orders/
│   └── page.tsx       # Danh sách đơn nhập hàng
├── export-orders/
│   └── page.tsx       # Danh sách đơn xuất hàng
├── returns/
│   └── page.tsx       # Danh sách đơn trả hàng
├── products/
│   └── page.tsx       # Sản phẩm & hết hạn
└── layout.tsx         # Updated navigation
```

## 📄 Chi tiết các trang

### 1. Import Orders Page (`/dashboard/import-orders`)

**Chức năng:**
- ✅ Hiển thị danh sách đơn nhập hàng với pagination
- ✅ Tìm kiếm theo số hóa đơn, nhà cung cấp
- ✅ Lọc theo trạng thái (Pending, Approved, Completed, Cancelled)
- ✅ Xem chi tiết đơn hàng
- ✅ Button tạo đơn nhập mới

**API Endpoints:**
```typescript
GET /api/import-orders?q=search&page=1&pageSize=10&status=Pending
GET /api/import-orders/{id}
POST /api/import-orders
```

**Features:**
- Search với debounce
- Pagination (10 items/page)
- Status badges với màu sắc phù hợp
- Responsive table
- Loading states

**UI Components sử dụng:**
- Card, Table, Badge
- Input với Search icon
- Select cho filter
- Button với gradients purple-teal

---

### 2. Export Orders Page (`/dashboard/export-orders`)

**Chức năng:**
- ✅ Hiển thị danh sách đơn xuất hàng
- ✅ Tìm kiếm theo số hóa đơn, khách hàng
- ✅ Lọc theo trạng thái
- ✅ Hiển thị tổng tiền thanh toán
- ✅ Xem chi tiết đơn hàng

**API Endpoints:**
```typescript
GET /api/ExportOrder/All
GET /api/ExportOrder/by-status?status=Pending
GET /api/ExportOrder/{id}Details
POST /api/ExportOrder/ExportOder
POST /api/ExportOrder/ExportDetail?exportOrderId=99
```

**Features:**
- Client-side search filtering
- Status filter với API call
- Currency formatting (VND)
- Date formatting (dd/MM/yyyy)
- Empty state với icon

---

### 3. Returns Page (`/dashboard/returns`)

**Chức năng:**
- ✅ Hiển thị danh sách đơn trả hàng
- ✅ Tìm kiếm theo số đơn, khách hàng
- ✅ Lọc theo trạng thái (dynamic từ API)
- ✅ Lọc theo ngày (date range)
- ✅ Hiển thị số lượng sản phẩm

**API Endpoints:**
```typescript
GET /api/returns/reasons
GET /api/returns/statuses
GET /api/returns/orders?from=2025-01-01&to=2025-12-31&status=Pending
GET /api/returns/orders/{id}
```

**Features:**
- Date range picker (HTML5 date input)
- Dynamic status filter từ API
- Fetch return statuses on mount
- Multiple filters (search + status + date)

---

### 4. Products Page (`/dashboard/products`)

**Chức năng:**
- ✅ Hiển thị sản phẩm sắp hết hạn
- ✅ Hiển thị sản phẩm đã hết hạn
- ✅ Alert cards cho summary
- ✅ Tabs để chuyển đổi giữa 2 danh sách
- ✅ Warning levels (Danger/Warning/Info)

**API Endpoints:**
```typescript
GET /api/product/near-expired
GET /api/product/expired
```

**Features:**
- Tabs (Near Expired / Expired)
- Alert components với variants
- Color-coded warning badges:
  - Red (Danger): ≤ 7 days
  - Orange (Warning): ≤ 30 days  
  - Yellow (Info): > 30 days
- Batch number tracking
- Stock quantity display

**Warning System:**
```typescript
- Nguy hiểm (Red): ≤ 7 ngày
- Cảnh báo (Orange): ≤ 30 ngày
- Lưu ý (Yellow): > 30 ngày
```

---

## 🎨 Design System

### Colors
```css
Primary: Purple (#a855f7 / purple-600)
Secondary: Teal (#14b8a6 / teal-600)
Gradient: from-purple-600 to-teal-600
```

### Status Colors
```typescript
Pending: outline (gray)
Approved: secondary (blue)
Completed: default (purple/teal)
Cancelled/Rejected: destructive (red)
```

### Typography
- Headings: Gradient text (purple → teal)
- Body: Gray-500 for descriptions
- Emphasized: Font-medium/semibold/bold

---

## 🔌 API Integration

### Axios Interceptors

**Request Interceptor:**
```typescript
// Tự động thêm Bearer token
config.headers.Authorization = `Bearer ${token}`
```

**Response Interceptor:**
```typescript
// Handle 401 → redirect to login
if (error.response?.status === 401) {
  localStorage.removeItem('token')
  window.location.href = '/login'
}
```

### Error Handling
Tất cả các trang đều có:
- Try-catch blocks
- Toast notifications
- Loading states
- Empty states

---

## 🚀 Navigation

**Updated Sidebar:**
```typescript
const navItems = [
  { href: '/dashboard', icon: Home, label: 'Tổng quan' },
  { href: '/dashboard/products', icon: Package, label: 'Sản phẩm' },
  { href: '/dashboard/import-orders', icon: ArrowDownToLine, label: 'Đơn Nhập' },
  { href: '/dashboard/export-orders', icon: ArrowUpFromLine, label: 'Đơn Xuất' },
  { href: '/dashboard/returns', icon: RotateCcw, label: 'Trả Hàng' },
  { href: '/dashboard/inventory', icon: Box, label: 'Tồn kho' },
  { href: '/ui-showcase', icon: Palette, label: 'Thư viện UI' },
]
```

---

## 📝 TypeScript Types

### Order Types
```typescript
interface ImportOrder {
  importOrderId: number
  invoiceNumber: string
  orderDate: string
  providerId: number
  providerName?: string
  status: OrderStatus | string
  items?: ImportOrderItem[]
}

interface ExportOrder {
  exportOrderId: number
  invoiceNumber: string
  customerId: number
  totalPayment?: number
  // ...
}
```

### Return Types
```typescript
interface ReturnOrder {
  returnOrderId: number
  returnNumber: string
  statusId: number
  items?: ReturnOrderItem[]
}

interface ReturnReason {
  reasonId: number
  reasonCode: string
  description: string
}
```

### Product Types
```typescript
interface ProductNearExpired {
  productId: number
  productCode: string
  productName: string
  expiryDate: string
  daysUntilExpiry: number
  warningLevel: 'danger' | 'warning' | 'info'
}
```

---

## ✅ Testing Checklist

### Import Orders Page
- [ ] Load page → fetch orders list
- [ ] Search by invoice number
- [ ] Filter by status
- [ ] Pagination works
- [ ] Click "Xem" → navigate to detail
- [ ] Click "Tạo Đơn Nhập" → navigate to create

### Export Orders Page
- [ ] Load page → fetch all orders
- [ ] Search by invoice/customer
- [ ] Filter by status → API call
- [ ] Display total payment in VND
- [ ] Click "Xem" → navigate to detail

### Returns Page
- [ ] Load statuses from API
- [ ] Search by return number
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Combined filters work together

### Products Page
- [ ] Fetch near expired products
- [ ] Fetch expired products
- [ ] Display correct counts in alerts
- [ ] Switch between tabs
- [ ] Color-coded warnings (red/orange/yellow)
- [ ] Show days until expiry

---

## 🐛 Known Limitations

1. **Detail Pages**: Chưa tạo các trang detail (`[id]/page.tsx`)
2. **Create Pages**: Chưa tạo các trang create (`/new/page.tsx`)
3. **Edit Functionality**: Chưa có form edit
4. **Delete Confirmation**: Chưa có modal xác nhận
5. **Advanced Filters**: Chưa có filter theo category, provider, customer
6. **Export Excel**: Chưa có chức năng export
7. **Print**: Chưa có chức năng in

---

## 🔮 Next Steps

### Priority 1: Detail Pages
```
- import-orders/[id]/page.tsx
- export-orders/[id]/page.tsx
- returns/[id]/page.tsx
- products/[id]/page.tsx
```

### Priority 2: Create/Edit Forms
```
- import-orders/new/page.tsx
- export-orders/new/page.tsx
- returns/new/page.tsx
```

### Priority 3: Additional Features
- Bulk actions
- Export to Excel
- Print functionality
- Advanced search
- Charts & analytics

---

## 💡 Tips

### Performance
- Sử dụng pagination để giảm load
- Debounce search để giảm API calls
- Cache API responses nếu cần

### UX
- Loading states rõ ràng
- Empty states với hướng dẫn
- Error messages cụ thể
- Success toast sau actions

### Accessibility
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

---

## 📞 Support

Nếu gặp lỗi:
1. Check console logs
2. Check network tab (API calls)
3. Verify backend is running
4. Check token validity
5. Review API documentation

---

## 🎯 Summary

**✅ Completed:**
- 4 main pages (Import, Export, Returns, Products)
- 3 API service files
- 3 type definition files
- Updated navigation
- Full TypeScript support
- Error handling & loading states
- Responsive design
- Purple-Teal gradient theme

**🔄 In Progress:**
- Detail pages
- Create/Edit forms
- Advanced features

**📊 Stats:**
- Total Files Created: 10+
- Lines of Code: 2000+
- API Endpoints Integrated: 15+
- UI Components Used: 20+
