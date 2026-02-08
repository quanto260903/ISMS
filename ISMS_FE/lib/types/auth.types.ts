/**
 * Authentication Related Types
 */

import { User } from './user.types';

// Auth Response Data
export interface AuthData {
  user: User;
  token: string;
}

// Google Auth Response Data
export interface GoogleAuthData extends User {
  token: string;
  isNewUser: boolean;
}

// Google Auth URL Data
export interface GoogleAuthUrlData {
  authUrl: string;
}

// Request Models
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  code: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: number;
}
