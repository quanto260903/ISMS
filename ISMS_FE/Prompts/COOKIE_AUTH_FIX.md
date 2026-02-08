# Cookie-based Authentication Setup

## Vấn đề đã sửa:
Middleware không thể đọc localStorage nên không thể verify authentication → Luôn redirect về `/login?redirect=/dashboard`

## Giải pháp:
Lưu token và userRole vào cả localStorage VÀ cookies để:
- **localStorage**: Client-side state management (Zustand)
- **Cookies**: Server-side authentication check (Middleware)

## Changes made:

### 1. `store/authStore.ts`
**Login function:**
```typescript
// Save to localStorage
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Save to cookies for middleware
document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Strict`;
```

**Register function:**
```typescript
// Save to cookies for middleware
document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Strict`;
```

**Logout function:**
```typescript
// Clear cookies
document.cookie = 'token=; path=/; max-age=0';
document.cookie = 'userRole=; path=/; max-age=0';
```

### 2. `app/login/page.tsx`
**Redirect handling:**
```typescript
// Get redirect URL from query params or default to dashboard
const redirectUrl = searchParams.get('redirect') || '/dashboard'

// Use window.location for hard navigation to ensure middleware runs
window.location.href = redirectUrl
```

### 3. `app/register/page.tsx`
**Hard navigation after register:**
```typescript
// Use window.location for hard navigation to ensure middleware runs
window.location.href = '/dashboard'
```

## Flow:

1. **User visits `/dashboard` without login**
   - Middleware checks cookies → No token found
   - Redirect to `/login?redirect=/dashboard`

2. **User logs in**
   - authStore.login() saves token to localStorage + cookies
   - window.location.href redirects to `/dashboard`
   - Middleware checks cookies → Token found ✅
   - Allow access to dashboard

3. **User logs out**
   - authStore.logout() clears localStorage + cookies
   - Redirect to `/login`

## Cookie Settings:
- **Path**: `/` (available for all routes)
- **Max-Age**: 86400 seconds (24 hours)
- **SameSite**: Strict (CSRF protection)
- **No HttpOnly**: Need to access from client-side JS

## Security Notes:
- Cookies are set with `SameSite=Strict` to prevent CSRF attacks
- Token expiry is 24 hours
- Middleware adds security headers (X-Frame-Options, X-Content-Type-Options, etc.)
