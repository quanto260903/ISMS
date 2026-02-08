# Sửa lỗi và Tính năng mới

## Ngày: 2024

### 🔧 Sửa lỗi Login Redirect

**Vấn đề**: Sau khi đăng nhập thành công, trang web vẫn ở trang login với URL `http://localhost:3001/login?redirect=%2Fdashboard`

**Nguyên nhân**:
1. Cookie `userRole` được set với giá trị number nhưng middleware check với string
2. Cookie `SameSite=Strict` quá nghiêm ngặt cho redirects
3. Middleware check role Admin với `'1'` thay vì `'2'`

**Giải pháp**:
1. ✅ Chuyển đổi `user.role` thành string khi lưu cookie: `String(user.role)`
2. ✅ Thay đổi `SameSite=Strict` → `SameSite=Lax` để cho phép redirects
3. ✅ Tăng thời gian cookie từ 1 ngày (86400) → 7 ngày (604800)
4. ✅ Sửa middleware check Admin role từ `'1'` → `'2'`

**Files đã sửa**:
- `store/authStore.ts`: Cập nhật cách set cookies trong `login()` và `register()`
- `middleware.ts`: Sửa check Admin role từ `'1'` thành `'2'`

### ✨ Tính năng tìm kiếm bằng giọng nói

**Mô tả**: Thêm khả năng tìm kiếm bằng giọng nói tiếng Việt trên dashboard

**Tính năng**:
- 🎤 Nút microphone để bật/tắt ghi âm
- 🔴 Hiệu ứng animation khi đang ghi âm (pulsing red)
- 📝 Hiển thị văn bản real-time khi nói
- 🇻🇳 Hỗ trợ tiếng Việt (`vi-VN`)
- ⚠️ Xử lý lỗi khi trình duyệt không hỗ trợ
- 🔄 Tự động cập nhật search query

**Công nghệ**: 
- Web Speech API (SpeechRecognition)
- Browser native (không cần library)
- Continuous listening với interim results

**Files tạo mới**:
- `components/voice-search.tsx`: Component chính với 150+ dòng code
- Integration trong `app/dashboard/layout.tsx`

### 🎨 Theme và Styling

**Màu sắc**: Purple (#a855f7) → Teal (#14b8a6) gradient
- Primary: `hsl(262 83% 58%)` - Purple
- Secondary: `hsl(173 80% 40%)` - Teal
- Accent: Purple/Teal gradient backgrounds

**UI Components**:
- Shadcn/ui với Radix UI
- Tailwind CSS utilities
- Lucide React icons
- Responsive design

### 🔐 Authentication Flow

**Login Flow**:
1. User nhập email/password → Submit form
2. Call `authStore.login(credentials)`
3. API response với `{ user, token }`
4. Save token và user:
   - ✅ localStorage (for app state)
   - ✅ cookies (for middleware)
5. Set cookies: `token` và `userRole`
6. Redirect với `window.location.href = redirectUrl`
7. Middleware check cookies → Allow access

**Middleware Logic**:
```typescript
// Public routes: /login, /register
// Protected routes: /dashboard/*
// Admin routes: /dashboard/settings/users, roles

// Check cookies:
- token: required for protected routes
- userRole: '2' for Admin, '1' for Staff, '0' for User
```

### 🌐 API Integration

**Base URL**: `http://localhost:8080/api`

**Auth Endpoints**:
- POST `/warehouse/auth/register` - Đăng ký
- POST `/warehouse/auth/login` - Đăng nhập
- GET `/warehouse/auth/me` - Lấy thông tin user
- PUT `/warehouse/auth/update` - Cập nhật thông tin
- PUT `/warehouse/auth/change-password` - Đổi mật khẩu
- GET `/warehouse/auth/google-url` - Lấy Google OAuth URL
- POST `/warehouse/auth/google-callback` - Callback sau Google login
- POST `/warehouse/auth/logout` - Đăng xuất

### 📱 User Roles

```typescript
enum UserRole {
  User = 0,    // Người dùng thường
  Staff = 1,   // Nhân viên
  Admin = 2    // Quản trị viên
}
```

**Quyền truy cập**:
- User (0): Dashboard, Products, Orders
- Staff (1): + Inventory management
- Admin (2): + Settings, User management

### 🧪 Testing Instructions

**Test Login Redirect**:
1. Start backend: `cd SWS_BE && dotnet run`
2. Start frontend: `cd SWS_FE && npm run dev`
3. Open: `http://localhost:3001/login`
4. Login với credentials
5. Check: Should redirect to `/dashboard`
6. DevTools → Application → Cookies → Check `token` and `userRole` exist

**Test Voice Search**:
1. Open: `http://localhost:3001/dashboard`
2. Click microphone icon in search bar
3. Allow browser microphone permission
4. Speak in Vietnamese
5. Check: Text appears in search input
6. Click mic again to stop

**Browser Support**:
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Limited support
- Safari: ⚠️ Requires prefix
- Mobile: ⚠️ Varies by browser

### 🐛 Known Issues & Workarounds

1. **Cookie SameSite**: 
   - Issue: Strict prevents redirects
   - Solution: Use `Lax` for better compatibility

2. **Voice Search Browser Support**:
   - Issue: Not all browsers support Web Speech API
   - Solution: Graceful fallback to text input only

3. **Role String Conversion**:
   - Issue: Number role vs string cookie
   - Solution: Always use `String(user.role)`

### 📝 TODO

- [ ] Test with real backend server
- [ ] Add loading states for voice recognition
- [ ] Implement Google OAuth callback handling
- [ ] Create Products, Orders, Inventory pages
- [ ] Add search results display
- [ ] Improve error messages
- [ ] Add unit tests for auth flow
- [ ] Add e2e tests for voice search

### 🚀 Next Steps

1. **Immediate**: Test login flow with backend running
2. **Voice Search**: Test microphone permissions and Vietnamese recognition
3. **Dashboard Pages**: Create Products, Orders, Inventory pages
4. **Google OAuth**: Test OAuth flow end-to-end
5. **Polish**: Add loading states, better error handling

---

## Command Reference

```bash
# Start development
cd SWS_FE
npm run dev

# Build for production
npm run build

# Check types
npm run type-check

# Lint code
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=Hệ thống Quản lý Kho
```
