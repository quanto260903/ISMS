import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/api/auth.api';
import type { User } from '@/lib/types/user.types';
import type { LoginRequest, RegisterRequest } from '@/lib/types/auth.types';

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.login(credentials);
          
          if (response.isSuccess && response.data) {
            const { user, token } = response.data;
            
            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Save to cookies for middleware (7 days, SameSite=Lax for cross-domain)
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `userRole=${String(user.role)}; path=/; max-age=604800; SameSite=Lax`;
            
            // Update store
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.register(data);
          
          if (response.isSuccess && response.data) {
            const { user, token } = response.data;
            
            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Save to cookies for middleware (7 days, SameSite=Lax for cross-domain)
            document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `userRole=${String(user.role)}; path=/; max-age=604800; SameSite=Lax`;
            
            // Update store
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear cookies
        document.cookie = 'token=; path=/; max-age=0';
        document.cookie = 'userRole=; path=/; max-age=0';
        
        // Clear store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        
        // Call API logout (optional, for server-side cleanup)
        authService.logout();
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
          setCookie('token', token, 7);
        } else {
          localStorage.removeItem('token');
          deleteCookie('token');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      fetchMe: async () => {
        try {
          const token = get().token;
          if (!token) {
            throw new Error('No token found');
          }

          set({ isLoading: true });
          
          const response = await authService.getMe();
          
          if (response.isSuccess && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Failed to fetch user');
          }
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          // Clear localStorage on error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
