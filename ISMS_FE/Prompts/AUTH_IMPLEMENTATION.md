# Authentication Implementation Guide

## 🎯 Overview
Hệ thống authentication đã được hoàn thiện với các tính năng:
- ✅ Login với email/password
- ✅ Register với form validation
- ✅ Google OAuth integration
- ✅ JWT token management
- ✅ Zustand state management
- ✅ API service với axios interceptors
- ✅ Error handling và toast notifications

## 📁 File Structure

```
SWS_FE/
├── lib/types/
│   └── api.types.ts              # TypeScript interfaces cho API
├── services/api/
│   └── auth.api.ts               # Auth API service
├── store/
│   └── authStore.ts              # Zustand auth store
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── register/
│       └── page.tsx              # Register page
└── .env.local                    # Environment variables
```

## 🔐 API Types (lib/types/api.types.ts)

### Base Response
```typescript
interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  data?: T;
  statusCode: number;
}
```

### User Model
```typescript
interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: number; // 0: User, 1: Staff/Admin
}
```

### Request Models
- `LoginRequest`: email, password
- `RegisterRequest`: fullName, email, password, phone?, address?, role
- `GoogleLoginRequest`: code
- `ChangePasswordRequest`: oldPassword, newPassword
- `UpdateUserRequest`: partial user fields

## 🌐 API Service (services/api/auth.api.ts)

### Available Methods

```typescript
authService.login(credentials)          // Login
authService.register(data)              // Register
authService.getMe()                     // Get current user
authService.getUserById(userId)         // Get user by ID
authService.updateUser(userId, data)    // Update user
authService.changePassword(data)        // Change password
authService.getGoogleAuthUrl()          // Get Google OAuth URL
authService.googleLogin(code)           // Login with Google
authService.logout()                    // Logout
```

### Features
- ✅ Axios interceptors for token injection
- ✅ Automatic 401 handling (redirect to login)
- ✅ LocalStorage token management
- ✅ Error response handling

## 🏪 Auth Store (store/authStore.ts)

### State
```typescript
{
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
```

### Actions
```typescript
login(credentials)      // Login and save token
register(data)          // Register and save token
logout()                // Clear auth state
setUser(user)           // Update user
setToken(token)         // Update token
clearError()            // Clear error message
fetchMe()               // Fetch current user from API
```

### Persistence
- Uses `zustand/persist` middleware
- Stores `user`, `token`, `isAuthenticated` in localStorage
- Key: `auth-storage`

## 🎨 UI Components

### Login Page (`app/login/page.tsx`)
**Features:**
- Split-screen design (gradient left, form right)
- Email/password inputs with icons
- Show/hide password toggle
- Remember me checkbox
- Google login button
- Link to register page
- Error handling with toast notifications
- Loading states

**Flow:**
1. User enters credentials
2. Calls `authStore.login()`
3. API validates and returns user + token
4. Store saves to localStorage
5. Redirects to `/dashboard`

### Register Page (`app/register/page.tsx`)
**Features:**
- Full registration form with validation
- Fields: fullName, email, phone, address, role, password, confirmPassword
- Password strength validation (min 6 chars)
- Password confirmation matching
- Terms and conditions checkbox
- Link to login page
- Error handling with toast notifications

**Validation:**
- ✅ Required fields (fullName, email, password)
- ✅ Email format validation
- ✅ Password length (min 6 chars)
- ✅ Password confirmation match
- ✅ Terms acceptance

## 🔧 Configuration

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### API Endpoints
Base: `http://localhost:5000/api/warehouse/auth`

- `POST /register` - Register new user
- `POST /login` - Login with credentials
- `GET /me` - Get current user
- `GET /{userId}` - Get user by ID
- `PUT /{userId}` - Update user
- `POST /change-password` - Change password
- `GET /google-url` - Get Google OAuth URL
- `POST /google-login` - Login with Google code

## 🚀 Usage Examples

### Login Flow
```typescript
const { login } = useAuthStore()

const handleLogin = async (email: string, password: string) => {
  try {
    await login({ email, password })
    // Success - user is authenticated
    router.push('/dashboard')
  } catch (error) {
    // Error - show error message
    toast.error(error.message)
  }
}
```

### Register Flow
```typescript
const { register } = useAuthStore()

const handleRegister = async (data: RegisterRequest) => {
  try {
    await register(data)
    // Success - user is registered and authenticated
    router.push('/dashboard')
  } catch (error) {
    // Error - show error message
    toast.error(error.message)
  }
}
```

### Google OAuth Flow
```typescript
// 1. Get Google OAuth URL
const response = await authService.getGoogleAuthUrl()
window.location.href = response.data.authUrl

// 2. User is redirected to Google
// 3. Google redirects back with code
// 4. Frontend calls backend with code
const result = await authService.googleLogin({ code })

// 5. Backend returns user + token
// 6. Save to store and redirect
```

### Check Authentication
```typescript
const { isAuthenticated, user } = useAuthStore()

if (isAuthenticated) {
  console.log('User is logged in:', user)
} else {
  console.log('User is not logged in')
}
```

### Logout
```typescript
const { logout } = useAuthStore()

const handleLogout = () => {
  logout() // Clears store and redirects to /login
}
```

## 🛡️ Middleware Protection

The `middleware.ts` file protects routes:
- Public routes: `/login`, `/register`
- Protected routes: `/dashboard/*`
- Checks for auth token in cookies
- Redirects unauthenticated users to `/login`

## 🎯 Next Steps

1. **Test with Backend API:**
   - Start backend server
   - Update `NEXT_PUBLIC_API_URL` in `.env.local`
   - Test login/register flows

2. **Add More Features:**
   - Forgot password flow
   - Email verification
   - Profile edit page
   - Change password page

3. **Error Handling:**
   - Add more specific error messages
   - Handle network errors
   - Add retry logic

4. **Security:**
   - Implement CSRF protection
   - Add rate limiting
   - Secure cookie settings

## 📚 Dependencies Used

```json
{
  "zustand": "State management",
  "axios": "HTTP client",
  "@radix-ui/react-*": "UI components",
  "lucide-react": "Icons",
  "next": "Framework"
}
```

## 🐛 Troubleshooting

### Token not saved
- Check localStorage in browser DevTools
- Verify `persist` middleware is working
- Check API response format matches `AuthResponse`

### API calls failing
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend
- Verify request/response formats

### Redirects not working
- Check middleware configuration
- Verify token is in localStorage
- Check route protection logic

### Google login not working
- Verify Google OAuth credentials
- Check redirect URI configuration
- Verify backend Google login endpoint

## 📝 Code Quality

- ✅ TypeScript strict mode
- ✅ Proper error handling
- ✅ Loading states
- ✅ User feedback (toasts)
- ✅ Form validation
- ✅ Responsive design
- ✅ Accessibility (labels, ARIA)
- ✅ Code comments
