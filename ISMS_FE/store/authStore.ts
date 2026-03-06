// ============================================================
//  store/authStore.ts
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/api/auth.api'
import type { User } from '@/lib/types/user.types'
import type { LoginRequest, RegisterRequest } from '@/lib/types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null })

          const response = await authService.login(credentials)

          if (response.isSuccess && response.data) {
            const { user, token } = response.data

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            // Middleware đọc cookie 'userRole' để kiểm tra quyền
            // UserRole.Admin = 1, Manager = 2, Staff = 3, Provider = 4
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
            document.cookie = `userRole=${String(user.role)}; path=/; max-age=604800; SameSite=Lax`

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
            document.cookie = `userRole=${String(user.role)}; path=/; max-age=604800; SameSite=Lax`

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
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        document.cookie = 'token=; path=/; max-age=0'
        document.cookie = 'userRole=; path=/; max-age=0'
        set({ user: null, token: null, isAuthenticated: false, error: null })
        authService.logout()
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
            set({ user: response.data, isAuthenticated: true, isLoading: false })
          } else {
            throw new Error(response.message || 'Failed to fetch user')
          }
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
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