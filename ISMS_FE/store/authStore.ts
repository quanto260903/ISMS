// store/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/api/auth.api'
import type { User } from '@/lib/types/user.types'
import type { LoginRequest, RegisterRequest } from '@/lib/types/auth.types'

interface AuthState {
  user:            User | null
  token:           string | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null

  login:              (credentials: LoginRequest) => Promise<void>
  register:           (data: RegisterRequest) => Promise<void>
  logout:             () => void
  checkAndAutoLogout: () => void
  setUser:            (user: User | null) => void
  setToken:           (token: string | null) => void
  clearError:         () => void
  fetchMe:            () => Promise<void>
}

// Helper xóa toàn bộ auth data
function clearAuthData() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  document.cookie = 'token=; path=/; max-age=0'
  // ✅ Xóa cả 2 cookie (mới + cũ) để đảm bảo sạch hoàn toàn
  document.cookie = 'userRoles=; path=/; max-age=0'
  document.cookie = 'userRole=; path=/; max-age=0'
}

function redirectToLogin(reason: string) {
  if (typeof window !== 'undefined') {
    window.location.href = `/login?reason=${reason}`
  }
}

// ✅ Helper set cookie userRoles từ user object
// Lưu mảng roles dưới dạng JSON để middleware đọc được đầy đủ
// Ví dụ: userRoles=[1,2,3]
function setRolesCookie(user: User) {
  const COOKIE_MAX_AGE = 'max-age=604800; SameSite=Lax'

  // Ưu tiên mảng roles (multi-role), fallback về role đơn (tương thích ngược)
  const roles: number[] = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : typeof user.role === 'number'
      ? [user.role]
      : []

  document.cookie = `userRoles=${JSON.stringify(roles)}; path=/; ${COOKIE_MAX_AGE}`

  // Giữ cookie cũ để tương thích ngược với code chưa migrate
  if (typeof user.role === 'number') {
    document.cookie = `userRole=${user.role}; path=/; ${COOKIE_MAX_AGE}`
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authService.login(credentials)

          if (response.isSuccess && response.data) {
            const { user, token } = response.data

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            // Token cookie
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`

            // ✅ Lưu mảng roles — middleware đọc từ đây để kiểm tra quyền
            setRolesCookie(user)

            set({ user, token, isAuthenticated: true, isLoading: false, error: null })
          } else {
            throw new Error(response.message || 'Đăng nhập thất bại')
          }
        } catch (error: any) {
          const msg = error.response?.data?.message || error.message || 'Đăng nhập thất bại'
          set({ error: msg, isLoading: false, isAuthenticated: false })
          throw error
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authService.register(data)

          if (response.isSuccess && response.data) {
            const { user, token } = response.data

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`

            // ✅ Lưu mảng roles
            setRolesCookie(user)

            set({ user, token, isAuthenticated: true, isLoading: false, error: null })
          } else {
            throw new Error(response.message || 'Đăng ký thất bại')
          }
        } catch (error: any) {
          const msg = error.response?.data?.message || error.message || 'Đăng ký thất bại'
          set({ error: msg, isLoading: false, isAuthenticated: false })
          throw error
        }
      },

      logout: () => {
  clearAuthData()
  set({ user: null, token: null, isAuthenticated: false, error: null })
  redirectToLogin('logout') // ✅ Thêm dòng này
},

      // ── Auto logout khi token hết hạn ──────────────────────
      checkAndAutoLogout: () => {
        const token = get().token
        if (!token) return

        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const exp: number = payload.exp
          if (Date.now() / 1000 > exp - 30) {
            get().logout()
            redirectToLogin('expired')
          }
        } catch {
          get().logout()
          redirectToLogin('expired')
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem('token', token)
          document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
        } else {
          localStorage.removeItem('token')
          document.cookie = 'token=; path=/; max-age=0'
        }
      },

      clearError: () => set({ error: null }),

      fetchMe: async () => {
        try {
          const token = get().token
          if (!token) throw new Error('No token')

          set({ isLoading: true })
          const response = await authService.getMe()

          if (response.isSuccess && response.data) {
            const user = response.data
            // ✅ Cập nhật lại roles cookie khi refresh user data
            setRolesCookie(user)
            set({ user, isAuthenticated: true, isLoading: false })
          } else {
            throw new Error(response.message || 'Failed to fetch user')
          }
        } catch {
          clearAuthData()
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          redirectToLogin('expired')
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)