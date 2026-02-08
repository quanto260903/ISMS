/**
 * Base API Response Types
 * Chỉ chứa các types liên quan đến API responses
 */

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

// API Error Response
export interface ApiError {
  isSuccess: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Common query params
export interface SearchParams {
  search?: string;
  filter?: Record<string, any>;
}
