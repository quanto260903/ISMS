# Cập Nhật API Đơn Nhập Hàng (Import Orders)

## Tổng Quan

Cập nhật module import-orders để tích hợp với API mới từ backend, bao gồm endpoint Providers riêng biệt và cải tiến API review.

---

## Các Thay Đổi Chính

### 1. API Providers Mới

**Endpoint**: `GET /api/business-partners/providers`

**Response**:
```json
[
  {
    "partnerId": 1,
    "name": "Nhà Cung Cấp A"
  },
  {
    "partnerId": 2,
    "name": "Nhà Cung Cấp B"
  }
]
```

**Changes**:
- ✅ Cập nhật `Provider` type: `partnerId`, `name` thay vì `providerId`, `providerName`
- ✅ Sửa `getProviders()` function gọi endpoint mới
- ✅ Load providers từ API riêng khi component mount

### 2. API Review Đơn Nhập Hàng

**Endpoint**: `PUT /api/import-orders/{id}/review`

**Request Body**:
```json
{
  "approve": true,
  "notes": "Ghi chú (tùy chọn)"
}
```

**Behavior**:
- `approve: true` → Duyệt đơn (status → Completed, cập nhật tồn kho)
- `approve: false` → Từ chối đơn (status → Canceled)

**Changes**:
- ✅ Thêm `reviewImportOrder()` function mới
- ✅ Giữ backward compatibility với `approveImportOrder()` và `rejectImportOrder()`

### 3. API List Import Orders

**Endpoint**: `GET /api/import-orders`

**Query Parameters**:
- `q`: Tìm kiếm theo invoice number
- `providerId`: Lọc theo nhà cung cấp
- `status`: Lọc theo trạng thái (Pending, Completed, Canceled)
- `from`, `to`: Lọc theo khoảng thời gian
- `page`, `pageSize`: Phân trang

**Response**:
```json
{
  "total": 15,
  "page": 1,
  "pageSize": 10,
  "items": [
    {
      "importOrderId": 101,
      "invoiceNumber": "PN-2024-00101",
      "orderDate": "2024-10-20",
      "providerName": "Nhà Cung Cấp A",
      "status": "Pending",
      "totalItems": 5,
      "createdByName": "Nguyen Van A"
    }
  ]
}
```

---

## Files Modified

### 1. Types (`lib/types/order.types.ts`)

**Before**:
```typescript
export interface Provider {
  providerId: number;
  providerName: string;
  providerCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}
```

**After**:
```typescript
export interface Provider {
  partnerId: number;
  name: string;
}
```

### 2. API Service (`services/api/import-orders.api.ts`)

**Before**:
```typescript
export async function getProviders(query?: string): Promise<ApiResponse<Provider[]>> {
  console.warn('getProviders API not implemented yet');
  return { isSuccess: true, data: [], statusCode: 200 };
}
```

**After**:
```typescript
export async function getProviders(): Promise<Provider[]> {
  const response = await apiClient.get<Provider[]>('/business-partners/providers');
  return response.data;
}

export async function reviewImportOrder(
  importOrderId: number,
  approve: boolean,
  notes?: string
): Promise<ApiResponse<any>> {
  const response = await apiClient.put<ApiResponse<any>>(
    `/import-orders/${importOrderId}/review`,
    { approve, notes }
  );
  return response.data;
}
```

### 3. Import Orders Page (`app/dashboard/import-orders/page.tsx`)

**Changes**:
- ✅ Load providers từ API khi mount: `fetchProviders()` trong `useEffect`
- ✅ Sử dụng `partnerId` và `name` thay vì `providerId` và `providerName`
- ✅ Filter combobox mapping đúng với type mới

**Before**:
```tsx
...providers.map((provider) => ({
  value: provider.providerId.toString(),
  label: provider.providerName,
}))
```

**After**:
```tsx
...providers.map((provider) => ({
  value: provider.partnerId.toString(),
  label: provider.name,
}))
```

---

## API Endpoints Đầy Đủ

### Import Orders Controller

1. **GET /api/import-orders** - List với filter & pagination
2. **GET /api/import-orders/{id}** - Chi tiết đơn nhập
3. **POST /api/import-orders** - Tạo đơn mới
4. **PUT /api/import-orders/{id}/review** - Duyệt/Từ chối đơn

### Business Partners Controller

5. **GET /api/business-partners/providers** - Danh sách nhà cung cấp

---

## Testing Checklist

- [ ] Load providers dropdown hiển thị đúng danh sách
- [ ] Filter theo provider hoạt động với `providerId`
- [ ] Tạo đơn nhập mới với provider selection
- [ ] Duyệt đơn nhập (approve) cập nhật status thành Completed
- [ ] Từ chối đơn nhập (reject) cập nhật status thành Canceled
- [ ] Search theo invoice number
- [ ] Filter theo status (Pending, Completed, Canceled)
- [ ] Filter theo date range (from/to)
- [ ] Pagination hoạt động đúng

---

## Notes

- ⚠️ **ImportOrderListItem** response không có `providerId`, chỉ có `providerName` → Filter theo provider ID vẫn hoạt động nhưng không thể map ngược
- ✅ Backward compatibility: Các functions `approveImportOrder()` và `rejectImportOrder()` vẫn hoạt động
- 🔄 Nếu cần: Backend có thể thêm `providerId` vào `ImportOrderListItem` để filter chính xác hơn

---

*Cập nhật: 09/12/2025*
