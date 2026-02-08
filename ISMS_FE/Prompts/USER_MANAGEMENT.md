# User Management Feature Documentation

## Tổng quan

Module Quản lý Người dùng cho phép Admin và Manager quản lý tài khoản người dùng trong hệ thống WMS Pro.

## Tính năng

### 1. Danh sách Người dùng
- Hiển thị danh sách người dùng dạng bảng với phân trang
- Thông tin hiển thị: ID, Email, Họ tên, Số điện thoại, Vai trò
- Hỗ trợ tìm kiếm theo email và tên
- Lọc theo vai trò (Admin, Manager, Staff, Provider)
- Phân trang với 10 người dùng/trang

### 2. Tạo Người dùng Mới (Admin only)
- Nhập thông tin: Email, Password, Họ tên, Số điện thoại, Địa chỉ, Vai trò
- Validation:
  - Email: Bắt buộc, định dạng email hợp lệ
  - Password: Bắt buộc, tối thiểu 6 ký tự
  - Họ tên: Bắt buộc
  - Vai trò: Bắt buộc (1-4)
- Hiển thị thông báo thành công/lỗi

### 3. Chỉnh sửa Người dùng (Admin only)
- Cập nhật: Họ tên, Số điện thoại, Địa chỉ, Vai trò
- Không thể thay đổi Email và Password qua chức năng này
- Hiển thị thông báo thành công/lỗi

### 4. Xóa Người dùng (Admin only)
- Xác nhận trước khi xóa
- Hiển thị thông báo thành công/lỗi

### 5. Xem Chi tiết Người dùng
- Hiển thị đầy đủ thông tin người dùng
- Có thể xem bởi cả Admin và Manager

## Phân quyền

### Admin (Role = 1)
- Xem danh sách người dùng
- Tạo người dùng mới
- Chỉnh sửa người dùng
- Xóa người dùng
- Xem chi tiết người dùng

### Manager (Role = 2)
- Xem danh sách người dùng
- Xem chi tiết người dùng

### Staff (Role = 3) & Provider (Role = 4)
- Không có quyền truy cập trang này
- Sẽ được chuyển hướng đến trang /unauthorized

## API Endpoints

### GET /api/user
Lấy danh sách người dùng với phân trang và lọc

**Query Parameters:**
- `pageIndex`: Số trang (mặc định: 1)
- `pageSize`: Số lượng/trang (mặc định: 10)
- `search`: Tìm kiếm theo email, tên
- `roleFilter`: Lọc theo vai trò (1-4)
- `sortBy`: Sắp xếp theo trường
- `sortDesc`: Sắp xếp giảm dần (true/false)

### GET /api/user/{id}
Lấy thông tin chi tiết người dùng

### POST /api/user
Tạo người dùng mới (Admin only)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC",
  "role": 3
}
```

### PUT /api/user/{id}
Cập nhật thông tin người dùng (Admin only)

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC",
  "role": 3
}
```

### DELETE /api/user/{id}
Xóa người dùng (Admin only)

### GET /api/user/providers
Lấy danh sách nhà cung cấp (Role = 4)

## Vai trò (Roles)

| Role ID | Tên | Mô tả |
|---------|-----|-------|
| 1 | Admin | Quản trị viên - Toàn quyền |
| 2 | Manager | Quản lý - Xem thông tin |
| 3 | Warehouse Staff | Nhân viên kho |
| 4 | Provider/Supplier | Nhà cung cấp |

## UI Components

### Bảng Người dùng
- Header với gradient màu purple-teal
- Nút "Tạo người dùng mới" (chỉ Admin)
- Thanh tìm kiếm và bộ lọc vai trò
- Bảng dữ liệu với các cột: ID, Email, Họ tên, SĐT, Vai trò, Thao tác
- Badge màu sắc theo vai trò:
  - Admin: Purple-Pink gradient
  - Manager: Blue-Cyan gradient
  - Staff: Green-Teal gradient
  - Provider: Orange-Amber gradient

### Dialogs
1. **Create Dialog**: Form tạo người dùng mới
2. **Edit Dialog**: Form chỉnh sửa thông tin
3. **Delete Dialog**: Xác nhận xóa
4. **View Dialog**: Hiển thị chi tiết người dùng

### Toast Notifications
- Sử dụng Sonner toast
- Hiển thị thông báo thành công/lỗi
- Tự động ẩn sau vài giây

## Cách sử dụng

### Truy cập trang
1. Đăng nhập với tài khoản Admin hoặc Manager
2. Vào menu "Quản lý Hệ thống" > "Quản lý Người dùng"
3. URL: `/dashboard/user-management`

### Tìm kiếm và lọc
1. Nhập từ khóa vào ô tìm kiếm (email, tên)
2. Chọn vai trò từ dropdown để lọc
3. Kết quả tự động cập nhật

### Tạo người dùng mới (Admin)
1. Click nút "Tạo người dùng mới"
2. Điền đầy đủ thông tin bắt buộc (*)
3. Chọn vai trò phù hợp
4. Click "Tạo người dùng"

### Chỉnh sửa người dùng (Admin)
1. Click icon Edit (bút) trên hàng người dùng
2. Cập nhật thông tin cần thiết
3. Click "Cập nhật"

### Xóa người dùng (Admin)
1. Click icon Delete (thùng rác) trên hàng người dùng
2. Xác nhận trong dialog
3. Click "Xóa người dùng"

### Xem chi tiết
1. Click icon View (mắt) trên hàng người dùng
2. Xem thông tin đầy đủ trong dialog
3. Click "Đóng" để thoát

## Files Created/Modified

### New Files
1. `/services/api/user-management.api.ts` - API service
2. `/app/dashboard/user-management/page.tsx` - Main page
3. `/components/ui/sonner.tsx` - Toast component

### Modified Files
1. `/lib/types/user.types.ts` - Added new types
2. `/app/dashboard/layout.tsx` - Added menu item and Toaster

## Dependencies
- `sonner` - Toast notifications (đã cài đặt)
- `@radix-ui/react-dialog` - Dialog components
- `@radix-ui/react-select` - Select dropdown
- `lucide-react` - Icons

## Testing

### Test Cases
1. ✅ Truy cập trang với Admin role
2. ✅ Truy cập trang với Manager role
3. ✅ Redirect khi truy cập với Staff/Provider role
4. ✅ Tìm kiếm người dùng
5. ✅ Lọc theo vai trò
6. ✅ Phân trang
7. ✅ Tạo người dùng mới (Admin)
8. ✅ Chỉnh sửa người dùng (Admin)
9. ✅ Xóa người dùng (Admin)
10. ✅ Xem chi tiết người dùng

### Manual Testing Steps
1. Login as Admin
2. Navigate to User Management
3. Test search functionality
4. Test role filter
5. Create a new user
6. Edit the created user
7. View user details
8. Delete the user
9. Login as Manager and verify read-only access
10. Login as Staff and verify redirect to unauthorized

## Notes
- Email không thể thay đổi sau khi tạo
- Password không thể thay đổi qua trang này (cần chức năng riêng)
- Xóa người dùng là hard delete (không phải soft delete)
- Tất cả API calls đều yêu cầu JWT token
- Toast notifications tự động ẩn sau 3-5 giây
