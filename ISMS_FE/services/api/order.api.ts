// Order API Service - Import & Export Orders
import axios from 'axios';
import type { 
  ImportOrder, 
  ImportOrderDetail,
  ImportOrderListItem,
  CreateImportOrderRequest,
  CreateImportOrderResponse,
  ExportOrder,
  ExportOrderDetail,
  ExportOrderListItem,
  CreateExportOrderRequest,
  CreateExportOrderResponse,
  AddExportDetailRequest,
  AddExportDetailResponse,
  OrderListResponse,
  OrderQueryParams,
} from '@/lib/types/order.types';
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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== IMPORT ORDERS =====

export const importOrderApi = {
  // List import orders with search and pagination
  list: async (params?: OrderQueryParams): Promise<ApiResponse<OrderListResponse<ImportOrderListItem>>> => {
    const { data } = await apiClient.get('/import-orders', { params });
    return data;
  },

  // Get import order detail by ID
  getById: async (id: number): Promise<ApiResponse<ImportOrderDetail>> => {
    const { data } = await apiClient.get(`/import-orders/${id}`);
    return data;
  },

  // Create new import order
  create: async (request: CreateImportOrderRequest): Promise<ApiResponse<CreateImportOrderResponse>> => {
    const { data } = await apiClient.post('/import-orders', request);
    return data;
  },

  // Update import order (if endpoint exists)
  update: async (id: number, request: Partial<CreateImportOrderRequest>): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.put(`/import-orders/${id}`, request);
    return data;
  },

  // Delete import order (if endpoint exists)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/import-orders/${id}`);
    return data;
  },

  // Approve import order (if endpoint exists)
  approve: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/import-orders/${id}/approve`);
    return data;
  },

  // Complete import order (if endpoint exists)
  complete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/import-orders/${id}/complete`);
    return data;
  },

  // Cancel import order (if endpoint exists)
  cancel: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/import-orders/${id}/cancel`);
    return data;
  },
};

// ===== EXPORT ORDERS =====

export const exportOrderApi = {
  // List all export orders
  listAll: async (): Promise<ApiResponse<ExportOrderListItem[]>> => {
    const { data } = await apiClient.get('/ExportOrder/All');
    return data;
  },

  // List export orders by status
  listByStatus: async (status: string): Promise<ApiResponse<ExportOrderListItem[]>> => {
    const { data } = await apiClient.get('/ExportOrder/by-status', { params: { status } });
    return data;
  },

  // Get export order detail by ID
  getById: async (id: number): Promise<ApiResponse<ExportOrderDetail>> => {
    const { data } = await apiClient.get(`/ExportOrder/${id}Details`);
    return data;
  },

  // Create new export order
  create: async (request: CreateExportOrderRequest): Promise<ApiResponse<CreateExportOrderResponse>> => {
    const { data } = await apiClient.post('/ExportOrder/ExportOder', request);
    return data;
  },

  // Add item to existing export order
  addDetail: async (
    exportOrderId: number, 
    request: AddExportDetailRequest
  ): Promise<ApiResponse<AddExportDetailResponse>> => {
    const { data } = await apiClient.post(`/ExportOrder/ExportDetail`, request, {
      params: { exportOrderId },
    });
    return data;
  },

  // Update export order (if endpoint exists)
  update: async (id: number, request: Partial<CreateExportOrderRequest>): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.put(`/ExportOrder/${id}`, request);
    return data;
  },

  // Delete export order (if endpoint exists)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/ExportOrder/${id}`);
    return data;
  },

  // Approve export order (if endpoint exists)
  approve: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/ExportOrder/${id}/approve`);
    return data;
  },

  // Complete export order (if endpoint exists)
  complete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/ExportOrder/${id}/complete`);
    return data;
  },

  // Cancel export order (if endpoint exists)
  cancel: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`/ExportOrder/${id}/cancel`);
    return data;
  },
};

// Combined export for convenience
export const orderApi = {
  import: importOrderApi,
  export: exportOrderApi,
};

export default orderApi;
