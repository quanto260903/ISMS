// ============================================================
//  services/api/auth.api.ts
// ============================================================

import axios from 'axios'
import type { ApiResponse } from '@/lib/types/api.types'
import type { User } from '@/lib/types/user.types'
import type {
  AuthData,
  GoogleAuthData,
  GoogleAuthUrlData,
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
} from '@/lib/types/auth.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/Auth`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Gắn token vào mọi request
authApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → về login
authApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  /** POST /warehouse/auth/login */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthData>> => {
    const res = await authApi.post<ApiResponse<AuthData>>('/login', data)
    return res.data
  },

  /** POST /warehouse/auth/register */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthData>> => {
    const res = await authApi.post<ApiResponse<AuthData>>('/register', data)
    return res.data
  },

  /** GET /warehouse/auth/me */
  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await authApi.get<ApiResponse<User>>('/me')
    return res.data
  },

  /** GET /warehouse/auth/{userId} */
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    const res = await authApi.get<ApiResponse<User>>(`/${userId}`)
    return res.data
  },

  /** PUT /warehouse/auth/{userId} */
  updateUser: async (userId: number, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const res = await authApi.put<ApiResponse<User>>(`/${userId}`, data)
    return res.data
  },

  /** POST /warehouse/auth/change-password */
  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<void>> => {
    const res = await authApi.post<ApiResponse<void>>('/change-password', data)
    return res.data
  },

  /** GET /warehouse/auth/google-url */
  getGoogleAuthUrl: async (): Promise<ApiResponse<GoogleAuthUrlData>> => {
    const res = await authApi.get<ApiResponse<GoogleAuthUrlData>>('/google-url')
    return res.data
  },

  /** POST /warehouse/auth/google-login */
  googleLogin: async (data: GoogleLoginRequest): Promise<ApiResponse<GoogleAuthData>> => {
    const res = await authApi.post<ApiResponse<GoogleAuthData>>('/google-login', data)
    return res.data
  },

  /** POST /warehouse/auth/logout */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
}

export default authService