# ✅ Cập nhật Products List - Image Preview & Page Size Selector

## 🎯 Tính năng mới

### 1. **Hiển thị ảnh sản phẩm** 🖼️
- ✅ Thumbnail 48x48px trong bảng
- ✅ Hover effect với overlay + Eye icon
- ✅ Fallback icon nếu không có ảnh
- ✅ Error handling cho ảnh lỗi

### 2. **Image Preview Dialog** 🔍
- ✅ Click vào ảnh → Mở popup full size
- ✅ Responsive dialog (max-width: 3xl)
- ✅ Aspect-square container
- ✅ Object-contain để giữ tỷ lệ
- ✅ Close button (X)
- ✅ Click overlay để đóng

### 3. **Page Size Selector** 📏
- ✅ Dropdown selector: 5, 10, 20, 50, 100 items
- ✅ Reset về trang 1 khi đổi page size
- ✅ Re-fetch data với pageSize mới
- ✅ Compact design (width: 80px)

### 4. **Updated API Response** 🔄
Thêm fields mới:
```typescript
{
  receivedDate?: string      // Ngày nhập hàng
  purchasedPrice?: number    // Giá nhập
  image?: string            // URL ảnh sản phẩm
  description?: string      // Mô tả chi tiết
}
```

## 📊 Table Layout Mới

### Columns (10 cột):
1. **Ảnh** - 48x48px thumbnail với hover preview
2. **Mã SP** - Serial Number (monospace)
3. **Tên sản phẩm** - Name + Category
4. **Đơn vị** - Unit
5. **Giá nhập** - Purchase Price (gray text)
6. **Giá bán** - Unit Price (bold)
7. **Tồn kho** - Stock badges
8. **Mức đặt lại** - Reorder point
9. **Hạn sử dụng** - Expiry date + badges
10. **Thao tác** - View/Edit buttons

## 🎨 Image Component Details

### Thumbnail in Table
```tsx
<div className="w-12 h-12 rounded-md overflow-hidden border">
  <Image
    src={product.image}
    alt={product.name}
    width={48}
    height={48}
    className="object-cover"
  />
</div>
```

### Hover Overlay
```tsx
<button className="absolute inset-0 bg-black/50 group-hover:opacity-100">
  <Eye className="h-5 w-5 text-white" />
</button>
```

### Fallback UI
```tsx
<div className="bg-gray-100 flex items-center justify-center">
  <ImageIcon className="h-6 w-6 text-gray-400" />
</div>
```

## 🖼️ Dialog Component

### Full Size Preview
```tsx
<Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>{selectedImage?.name}</DialogTitle>
      <DialogDescription>Ảnh sản phẩm</DialogDescription>
    </DialogHeader>
    <div className="relative w-full aspect-square">
      <Image
        src={selectedImage.url}
        alt={selectedImage.name}
        fill
        className="object-contain"
      />
    </div>
  </DialogContent>
</Dialog>
```

### State Management
```typescript
const [selectedImage, setSelectedImage] = useState<{
  url: string
  name: string
} | null>(null)

// Open dialog
onClick={() => setSelectedImage({ 
  url: product.image!, 
  name: product.name 
})}

// Close dialog
onOpenChange={() => setSelectedImage(null)}
```

## 📏 Page Size Selector

### UI Component
```tsx
<div className="flex items-center gap-2">
  <label className="text-sm text-gray-500">Hiển thị:</label>
  <Select
    value={String(pageSize)}
    onValueChange={(value) => {
      setPageSize(Number(value))
      setCurrentPage(1) // Reset to page 1
    }}
  >
    <SelectTrigger className="w-20 h-8">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="5">5</SelectItem>
      <SelectItem value="10">10</SelectItem>
      <SelectItem value="20">20</SelectItem>
      <SelectItem value="50">50</SelectItem>
      <SelectItem value="100">100</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### State Updates
```typescript
const [pageSize, setPageSize] = useState(10)

// Re-fetch when pageSize changes
useEffect(() => {
  fetchProducts()
}, [currentPage, pageSize])
```

## 🔄 Updated Pagination Bar

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Trang 1/3    Hiển thị: [10▼]    [Đầu] [Trước] [Sau] [Cuối] │
└─────────────────────────────────────────────────────────────┘
```

### Features
- ✅ Current page indicator
- ✅ Page size selector
- ✅ Navigation buttons
- ✅ Responsive (stacks on mobile)
- ✅ Border-top separator

## 🎯 User Interactions

### 1. View Image
```
Hover thumbnail → Eye icon appears
Click thumbnail → Dialog opens with full size
Click overlay or X → Dialog closes
```

### 2. Change Page Size
```
Click "Hiển thị" dropdown → Select size
Auto reset to page 1
Re-fetch data with new pageSize
Table updates
```

### 3. Navigate Pages
```
Click Đầu → Go to page 1
Click Trước → Previous page
Click Sau → Next page
Click Cuối → Go to last page
```

## 📱 Responsive Design

### Mobile (<640px)
- Pagination stacks vertically
- Image thumbnails remain 48x48px
- Dialog scales to screen
- Table horizontal scroll

### Tablet (640px-1024px)
- Side-by-side pagination controls
- Full table visible with scroll
- Dialog max-width maintained

### Desktop (>1024px)
- Full table width
- Inline pagination controls
- Large dialog preview

## 🔧 Technical Implementation

### Files Modified
1. **lib/types/product.types.ts**
   - Added: `receivedDate`, `purchasedPrice`, `image`, `description`

2. **app/dashboard/products-list/page.tsx**
   - Added: Image column
   - Added: Dialog for image preview
   - Added: Page size selector
   - Updated: Pagination bar layout
   - Added: `selectedImage` state
   - Added: `pageSize` state (was const)

3. **components/ui/dialog.tsx** (NEW)
   - Created Dialog component using Radix UI
   - Includes: Overlay, Content, Header, Footer, Title, Description

### Dependencies
- ✅ `@radix-ui/react-dialog` - Already installed
- ✅ `next/image` - Built-in Next.js
- ✅ `lucide-react` - Already installed

## 🎨 Styling Details

### Image Border
```css
border: 1px solid rgb(229, 231, 235) /* gray-200 */
hover: border-purple-500
```

### Hover Overlay
```css
bg-black/0 → bg-black/50
opacity-0 → opacity-100
transition-all
```

### Dialog Backdrop
```css
bg-black/80
animate fade-in/fade-out
```

## 📊 Example Data Display

### With Image:
```
┌────────────┬─────────────┬──────────────────────┬──────┐
│ [📷]       │ DT-IP14-001 │ iPhone 14 Pro Max    │ Cái  │
│   [👁️]     │             │ Điện thoại           │      │
└────────────┴─────────────┴──────────────────────┴──────┘
```

### Without Image:
```
┌────────────┬─────────────┬──────────────────────┬──────┐
│ [📦]       │ DT-SS-002   │ Samsung S23 Ultra    │ Cái  │
│            │             │ Điện thoại           │      │
└────────────┴─────────────┴──────────────────────┴──────┘
```

### Dialog Preview:
```
╔═══════════════════════════════════════════╗
║  iPhone 14 Pro Max 256GB              [X] ║
║  Ảnh sản phẩm                             ║
║ ┌───────────────────────────────────────┐ ║
║ │                                       │ ║
║ │         [Full Size Image]             │ ║
║ │                                       │ ║
║ └───────────────────────────────────────┘ ║
╚═══════════════════════════════════════════╝
```

## ✅ Testing Checklist

### Image Display
- [ ] Thumbnail shows correctly
- [ ] Hover shows eye icon
- [ ] Click opens dialog
- [ ] Dialog shows full image
- [ ] Close button works
- [ ] Click overlay closes
- [ ] Fallback icon for no image
- [ ] Error handling for broken images

### Page Size Selector
- [ ] Dropdown opens
- [ ] Select 5 items → Updates table
- [ ] Select 20 items → Updates table
- [ ] Select 100 items → Updates table
- [ ] Resets to page 1 on change
- [ ] Re-fetches data correctly

### Pagination
- [ ] Shows correct page numbers
- [ ] Page size displayed correctly
- [ ] Navigation buttons work
- [ ] Disabled states correct
- [ ] Responsive on mobile

### API Integration
- [ ] Sends correct pageSize param
- [ ] Receives image URLs
- [ ] Displays purchasedPrice
- [ ] Shows receivedDate (if used)

## 🚀 Performance Optimizations

### Image Loading
- Next.js Image optimization
- Lazy loading by default
- Width/height specified
- Object-fit CSS

### Dialog
- Mounted on demand
- Unmounts on close
- No memory leaks

### Page Size
- Minimal re-renders
- Debounced if needed
- Efficient state updates

## 📝 Code Quality

### TypeScript
- ✅ Fully typed interfaces
- ✅ Type-safe state
- ✅ No any types

### React Best Practices
- ✅ Proper hooks usage
- ✅ Cleanup functions
- ✅ Memoization where needed

### Accessibility
- ✅ Alt text for images
- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ ARIA labels

## 🎊 Summary

Đã thêm thành công:
- ✅ Hiển thị ảnh sản phẩm với thumbnail 48x48px
- ✅ Dialog preview full size image
- ✅ Hover effect với eye icon overlay
- ✅ Page size selector (5, 10, 20, 50, 100)
- ✅ Updated pagination bar layout
- ✅ Giá nhập (purchasedPrice) hiển thị
- ✅ Fallback UI cho ảnh lỗi
- ✅ Responsive design
- ✅ Error handling

Ready to test! 🚀
