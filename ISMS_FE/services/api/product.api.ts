// Product API Service
import axios from 'axios';
import type {
  Product,
  ProductListItem,
  ProductExpiry,
  ProductNearExpired,
  ProductCategory,
  ProductUnit,
  ProductQueryParams,
  ProductPagedResponse,
  CreateProductRequest,
  UpdateProductRequest,
  StockLevel,
  StockMovement,
} from '@/lib/types/product.types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';

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

// ===== PRODUCTS =====

export const productApi = {
  // List products with pagination (using paged endpoint)
  listPaged: async (params?: ProductQueryParams): Promise<ProductPagedResponse> => {
    const { data } = await apiClient.get('/product/paged', { params });
    return data;
  },

  // List products with filters and pagination (fallback)
  list: async (params?: ProductQueryParams): Promise<ApiResponse<PaginatedResponse<ProductListItem>>> => {
    const { data } = await apiClient.get('/product', { params });
    return data;
  },

  // Get product by ID
  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.get(`/product/${id}`);
    return data;
  },

  // Create new product
  create: async (request: CreateProductRequest): Promise<ApiResponse<{ productId: number }>> => {
    const response = await apiClient.post('/product', request);

    // Backend returns 2xx status on success (e.g., 200, 201, 204)
    if (response.status >= 200 && response.status < 300) {
      return {
        isSuccess: true,
        responseCode: null,
        statusCode: response.status,
        data: response.data || null,
        message: response.data?.message || 'Tạo sản phẩm thành công'
      };
    }

    return response.data;
  },

  // Update product
  update: async (id: number, request: UpdateProductRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.put(`/product/${id}`, request);

    // Backend returns 2xx status on success
    if (response.status >= 200 && response.status < 300) {
      return {
        isSuccess: true,
        responseCode: null,
        statusCode: response.status,
        data: response.data || null,
        message: response.data?.message || 'Cập nhật sản phẩm thành công'
      };
    }

    return response.data;
  },

  // Delete product
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/product/${id}`);

    // Backend returns 2xx status on success
    if (response.status >= 200 && response.status < 300) {
      return {
        isSuccess: true,
        responseCode: null,
        statusCode: response.status,
        data: response.data || null,
        message: response.data?.message || 'Xóa sản phẩm thành công'
      };
    }

    return response.data;
  },

  // Get products near expiry
  getNearExpired: async (): Promise<ProductNearExpired[]> => {
    const { data } = await apiClient.get('/product/near-expired');
    // Backend returns array directly without ApiResponse wrapper
    return data.data;
  },

  // Get expired products
  getExpired: async (): Promise<ProductExpiry[]> => {
    const { data } = await apiClient.get('/product/expired');
    // Backend returns array directly without ApiResponse wrapper
    return data.data;
  },

  // Search products
  search: async (keyword: string): Promise<ProductListItem[]> => {
    const { data } = await apiClient.get('/product/search', { params: { text: keyword } });
    // Backend returns array directly without ApiResponse wrapper
    return data;
  },
};

// ===== PRODUCT CATEGORIES =====

export const productCategoryApi = {
  // List all categories
  list: async (): Promise<ApiResponse<ProductCategory[]>> => {
    const { data } = await apiClient.get('/products/categories');
    return data;
  },

  // Get category by ID
  getById: async (id: number): Promise<ApiResponse<ProductCategory>> => {
    const { data } = await apiClient.get(`/products/categories/${id}`);
    return data;
  },

  // Create category
  create: async (request: Omit<ProductCategory, 'categoryId'>): Promise<ApiResponse<{ categoryId: number }>> => {
    const { data } = await apiClient.post('/products/categories', request);
    return data;
  },

  // Update category
  update: async (id: number, request: Partial<ProductCategory>): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.put(`/products/categories/${id}`, request);
    return data;
  },

  // Delete category
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/products/categories/${id}`);
    return data;
  },
};

// ===== PRODUCT UNITS =====

export const productUnitApi = {
  // List all units
  list: async (): Promise<ApiResponse<ProductUnit[]>> => {
    const { data } = await apiClient.get('/products/units');
    return data;
  },

  // Get unit by ID
  getById: async (id: number): Promise<ApiResponse<ProductUnit>> => {
    const { data } = await apiClient.get(`/products/units/${id}`);
    return data;
  },

  // Create unit
  create: async (request: Omit<ProductUnit, 'unitId'>): Promise<ApiResponse<{ unitId: number }>> => {
    const { data } = await apiClient.post('/products/units', request);
    return data;
  },

  // Update unit
  update: async (id: number, request: Partial<ProductUnit>): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.put(`/products/units/${id}`, request);
    return data;
  },

  // Delete unit
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/products/units/${id}`);
    return data;
  },
};

// ===== INVENTORY / STOCK =====

export const inventoryApi = {
  // Get stock levels (low stock alerts)
  getStockLevels: async (): Promise<ApiResponse<StockLevel[]>> => {
    const { data } = await apiClient.get('/inventory/stock-levels');
    return data;
  },

  // Get stock movements history
  getStockMovements: async (params?: {
    productId?: number;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<StockMovement>>> => {
    const { data } = await apiClient.get('/inventory/movements', { params });
    return data;
  },

  // Get low stock products
  getLowStock: async (): Promise<ApiResponse<StockLevel[]>> => {
    const { data } = await apiClient.get('/inventory/low-stock');
    return data;
  },

  // Get critical stock products
  getCriticalStock: async (): Promise<ApiResponse<StockLevel[]>> => {
    const { data } = await apiClient.get('/inventory/critical-stock');
    return data;
  },
};

// Combined export for convenience
export const productsApi = {
  products: productApi,
  categories: productCategoryApi,
  units: productUnitApi,
  inventory: inventoryApi,
};

export default productsApi;
