// Order Types for Import and Export Orders

export enum OrderStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// Export Order Status Enum (as per backend)
export enum ExportOrderStatus {
  Pending = 0,
  Shipped = 1,
  Completed = 2,
  Canceled = 3,
}

// Import Order Types
export interface ImportOrderItem {
  importDetailId?: number;
  productId: number;
  productName?: string;
  quantity: number;
  importPrice: number;
}

export interface ImportOrder {
  importOrderId: number;
  invoiceNumber: string;
  orderDate: string;
  providerId: number;
  providerName?: string;
  status: OrderStatus | string;
  totalItems?: number;
  createdDate?: string;
  createdBy?: number;
  createdByName?: string;
  approvedByName?: string;
  completedByName?: string;
  note?: string;
  createdAt?: string;
  items?: ImportOrderItem[];
}

export interface ImportOrderListItem {
  importOrderId: number;
  invoiceNumber: string;
  orderDate: string;
  providerName: string;
  status: string;
  totalItems: number;
  createdByName: string;
}

export interface ImportOrderDetail extends ImportOrder {
  items: ImportOrderItem[];
}

export interface CreateImportOrderRequest {
  providerId: number;
  orderDate: string;
  invoiceNumber: string;
  items: {
    productId: number;
    quantity: number;
    importPrice: number;
  }[];
}

export interface CreateImportOrderResponse {
  importOrderId: number;
  invoiceNumber: string;
}

// Export Order Types
export interface ExportOrderItem {
  exportDetailId: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  exportPrice?: number;
  totalPrice?: number;
}

export interface ExportOrder {
  exportOrderId: number;
  invoiceNumber: string;
  orderDate: string;
  customerId: number;
  customerName?: string;
  currency?: string;
  shippedDate?: string;
  shippedAddress?: string;
  taxRate?: number;
  taxAmount?: number;
  totalPayment?: number;
  description?: string;
  status: OrderStatus | string;
  createdDate?: string;
  createdBy?: number;
  createdByName?: string;
  items?: ExportOrderItem[];
}

export interface ExportOrderListItem {
  exportOrderId: number;
  invoiceNumber: string;
  orderDate: string;
  customerId: number;
  customerName?: string;
  status: string;
  totalPayment?: number;
}

// ExportOrderDetail is same as ExportOrderItem - returned by /Details endpoint
export type ExportOrderDetail = ExportOrderItem;

export interface CreateExportOrderRequest {
  invoiceNumber: string;
  orderDate: string;
  customerId: number;
  currency: string;
  shippedDate?: string;
  shippedAddress?: string;
  taxRate: number;
  taxAmount: number;
  totalPayment: number;
  description?: string;
  createdBy: number;
}

export interface CreateExportOrderResponse {
  exportOrderId: number;
}

export interface AddExportDetailRequest {
  productId: number;
  quantity: number;
}

export interface AddExportDetailResponse {
  exportDetailId: number;
}

export interface UpdateExportOrderRequest {
  orderDate: string;
  customerId: number;
  currency: string;
  shippedDate?: string;
  shippedAddress?: string;
  taxRate: number;
  taxAmount: number;
  totalPayment: number;
  description?: string;
  status?: string;
  createdBy: number;
}

export interface UpdateExportDetailRequest {
  productId: number;
  quantity: number;
}

// Provider for Import Orders - From /api/business-partners/providers
export interface Provider {
  partnerId: number;
  name: string;
}

// Import Order Status Statistics
export interface ImportOrderStatusStats {
  status: string;
  count: number;
  totalValue: number;
}

// Import Order Statistics
export interface ImportOrderStatistics {
  dateRange: {
    from: string;
    to: string;
  };
  totalOrders: number;
  totalValue: number;
  totalItems: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  topProviders: {
    providerId: number;
    providerName: string;
    orderCount: number;
    totalValue: number;
  }[];
  topProducts: {
    productId: number;
    productName: string;
    totalQuantity: number;
    totalValue: number;
  }[];
}

// Import Order Approval/Rejection
export interface ApproveImportOrderRequest {
  note?: string;
}

export interface RejectImportOrderRequest {
  reason: string;
}

export interface CompleteImportOrderRequest {
  receivedDate: string;
  note?: string;
}

export interface ApprovalResponse {
  importOrderId: number;
  status: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedDate?: string;
  rejectedBy?: number;
  rejectedByName?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  completedBy?: number;
  completedByName?: string;
  completedDate?: string;
}

// Bulk Operations
export interface BulkApproveRequest {
  importOrderIds: number[];
  note?: string;
}

export interface BulkDeleteRequest {
  importOrderIds: number[];
}

export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  results: {
    importOrderId: number;
    success: boolean;
    error?: string;
  }[];
}

// Import Order Query Params (extends base)
export interface ImportOrderQueryParams extends OrderQueryParams {
  providerId?: number;
}

// Customer for Export Orders
export interface Customer {
  customerId: number;
  customerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

// List response with pagination
export interface OrderListResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

// Query params for listing orders
export interface OrderQueryParams {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// Export Order Filter Params
export interface ExportOrderFilterParams {
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
  status?: string; // "Pending", "Shipped", "Completed", "Canceled"
  customerId?: number;
  createdBy?: number;
  invoiceNumber?: string;
  pageNumber?: number; // starts from 1
  pageSize?: number; // max 100
}
