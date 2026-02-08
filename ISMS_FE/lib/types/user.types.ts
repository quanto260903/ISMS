/**
 * User Related Types
 */

// User Model
export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

// User Profile (from API)
export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

// Update Profile Request
export interface UpdateProfileRequest {
  username?: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  roleId?: number;
}

// Change Password Request
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// User Management API Types
export interface UserDto {
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: number;
  roleName: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: number;
}

export interface UpdateUserRequest {
  fullName: string;
  phone?: string;
  address?: string;
  role: number;
}

export interface UserPagedRequestDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  roleFilter?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface PagedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}

// Role enum - matching API values (1=Admin, 2=Manager, 3=Staff, 4=Provider)
export enum UserRole {
  User = 0,
  Admin = 1,
  Manager = 2,
  Staff = 3,
  Provider = 4,
}

// Role helper functions
export const isStaffOrAdmin = (role: UserRole): boolean => {
  return role >= UserRole.Admin;
};

export const isAdmin = (role: UserRole): boolean => {
  return role === UserRole.Admin;
};

export const isManager = (role: UserRole): boolean => {
  return role === UserRole.Manager;
};

export const isStaff = (role: UserRole): boolean => {
  return role === UserRole.Staff;
};

export const isProvider = (role: UserRole): boolean => {
  return role === UserRole.Provider;
};

export const getRoleName = (role: UserRole | number): string => {
  switch (role) {
    case UserRole.Admin:
    case 1:
      return 'Admin';
    case UserRole.Manager:
    case 2:
      return 'Manager';
    case UserRole.Staff:
    case 3:
      return 'Warehouse Staff';
    case UserRole.Provider:
    case 4:
      return 'Provider/Supplier';
    case UserRole.User:
    case 0:
      return 'User';
    default:
      return 'Unknown';
  }
};

export const getRoleOptions = () => [
  { value: 1, label: 'Admin' },
  { value: 2, label: 'Manager' },
  { value: 3, label: 'Warehouse Staff' },
  { value: 4, label: 'Provider/Supplier' },
];
