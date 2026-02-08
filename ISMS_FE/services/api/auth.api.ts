import axios from 'axios';
import type { ApiResponse } from '@/lib/types/api.types';
import type { User } from '@/lib/types/user.types';
import type {
  AuthData,
  GoogleAuthData,
  GoogleAuthUrlData,
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
} from '@/lib/types/auth.types';

// API Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/warehouse/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies
});

// Request interceptor to add token
authApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Register a new user
   * @param data - Registration data
   * @returns Promise with auth response (user + token)
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthData>> => {
    const response = await authApi.post<ApiResponse<AuthData>>('/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   * @param data - Login credentials
   * @returns Promise with auth response (user + token)
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthData>> => {
    const response = await authApi.post<ApiResponse<AuthData>>('/login', data);
    return response.data;
  },

  /**
   * Get current user info
   * @returns Promise with user data
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await authApi.get<ApiResponse<User>>('/me');
    return response.data;
  },

  /**
   * Get user by ID
   * @param userId - User ID to fetch
   * @returns Promise with user data
   */
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    const response = await authApi.get<ApiResponse<User>>(`/${userId}`);
    return response.data;
  },

  /**
   * Update user information
   * @param userId - User ID to update
   * @param data - Updated user data
   * @returns Promise with updated user data
   */
  updateUser: async (
    userId: number,
    data: UpdateUserRequest
  ): Promise<ApiResponse<User>> => {
    const response = await authApi.put<ApiResponse<User>>(`/${userId}`, data);
    return response.data;
  },

  /**
   * Change password
   * @param data - Old and new password
   * @returns Promise with success response
   */
  changePassword: async (
    data: ChangePasswordRequest
  ): Promise<ApiResponse<void>> => {
    const response = await authApi.post<ApiResponse<void>>(
      '/change-password',
      data
    );
    return response.data;
  },

  /**
   * Get Google OAuth URL
   * @returns Promise with Google auth URL
   */
  getGoogleAuthUrl: async (): Promise<ApiResponse<GoogleAuthUrlData>> => {
    const response = await authApi.get<ApiResponse<GoogleAuthUrlData>>('/google-url');
    return response.data;
  },

  /**
   * Login with Google OAuth code
   * @param data - Google OAuth code
   * @returns Promise with auth response (user + token)
   */
  googleLogin: async (data: GoogleLoginRequest): Promise<ApiResponse<GoogleAuthData>> => {
    const response = await authApi.post<ApiResponse<GoogleAuthData>>(
      '/google-login',
      data
    );
    return response.data;
  },

  /**
   * Logout (client-side only - clear local storage)
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

export default authService;
