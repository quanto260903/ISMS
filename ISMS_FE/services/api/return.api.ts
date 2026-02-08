// Return Order API Service
import axios from 'axios';
import type {
  ReturnOrder,
  ReturnOrderDetail,
  ReturnOrderListItem,
  CreateReturnOrderRequest,
  ReturnOrderQueryParams,
  ReturnReason,
  ReturnReasonQueryParams,
  ReturnStatus,
  ReturnStatusQueryParams,
} from '@/lib/types/return.types';
import type { ApiResponse } from '@/lib/types/api.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== RETURN REASONS =====

export const returnReasonApi = {
  // Get all return reasons
  list: async (params?: ReturnReasonQueryParams): Promise<ApiResponse<ReturnReason[]>> => {
    const { data } = await apiClient.get('/returns/reasons', { params });
    return data;
  },

  // Search return reasons by keyword
  search: async (keyword: string): Promise<ApiResponse<ReturnReason[]>> => {
    const { data } = await apiClient.get('/returns/reasons', { params: { q: keyword } });
    return data;
  },

  // Get reason by ID (if endpoint exists)
  getById: async (id: number): Promise<ApiResponse<ReturnReason>> => {
    const { data } = await apiClient.get(`/returns/reasons/${id}`);
    return data;
  },
};

// ===== RETURN STATUSES =====

export const returnStatusApi = {
  // Get all return statuses
  list: async (params?: ReturnStatusQueryParams): Promise<ApiResponse<ReturnStatus[]>> => {
    const { data } = await apiClient.get('/returns/statuses', { params });
    return data;
  },

  // Search return statuses by keyword
  search: async (keyword: string): Promise<ApiResponse<ReturnStatus[]>> => {
    const { data } = await apiClient.get('/returns/statuses', { params: { q: keyword } });
    return data;
  },

  // Get status by ID (if endpoint exists)
  getById: async (id: number): Promise<ApiResponse<ReturnStatus>> => {
    const { data } = await apiClient.get(`/returns/statuses/${id}`);
    return data;
  },
};

// ===== RETURN ORDERS =====

export const returnOrderApi = {
  // List return orders with filters
  list: async (params?: ReturnOrderQueryParams): Promise<ApiResponse<ReturnOrderListItem[]>> => {
    const { data } = await apiClient.get('/returns/orders', { params });
    return data;
  },

  // Get return order detail by ID
  getById: async (id: number): Promise<ApiResponse<ReturnOrderDetail>> => {
    const { data } = await apiClient.get(`/returns/orders/${id}`);
    return data;
  },

  // Create new return order (if endpoint exists)
  create: async (request: CreateReturnOrderRequest): Promise<ApiResponse<{ returnOrderId: number }>> => {
    const { data } = await apiClient.post('/returns/orders', request);
    return data;
  },

  // Update return order (if endpoint exists)
  update: async (id: number, request: Partial<CreateReturnOrderRequest>): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.put(`/returns/orders/${id}`, request);
    return data;
  },

  // Delete return order (if endpoint exists)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/returns/orders/${id}`);
    return data;
  },

  // Approve return order (if endpoint exists)
  approve: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/returns/orders/${id}/approve`);
    return data;
  },

  // Complete return order (if endpoint exists)
  complete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/returns/orders/${id}/complete`);
    return data;
  },

  // Cancel return order (if endpoint exists)
  cancel: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/returns/orders/${id}/cancel`);
    return data;
  },
};

// Combined export for convenience
export const returnApi = {
  reasons: returnReasonApi,
  statuses: returnStatusApi,
  orders: returnOrderApi,
};

export default returnApi;
