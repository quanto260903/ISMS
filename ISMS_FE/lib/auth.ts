'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  userId: number
  name: string
  email: string
  phone?: string
  address?: string
  role: number
  createdAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (token: string, user: User) => {
        // Lưu token vào cookie để middleware có thể đọc
        if (typeof window !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
          document.cookie = `userRole=${user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
        }
        
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        })
      },
      
      clearAuth: () => {
        // Xóa cookies
        if (typeof window !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
          document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        }
        
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        })
      },
      
      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
)
