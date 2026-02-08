import { apiClient } from '@/lib/api';
import type {
  ImportOrder,
  ImportOrderDetail,
  ImportOrderListItem,
  ImportOrderQueryParams,
  CreateImportOrderRequest,
  CreateImportOrderResponse,
  ApproveImportOrderRequest,
  RejectImportOrderRequest,
  CompleteImportOrderRequest,
  ApprovalResponse,
  Provider,
  ImportOrderStatusStats,
  ImportOrderStatistics,
  BulkApproveRequest,
  BulkDeleteRequest,
  BulkOperationResult,
  OrderListResponse,
} from '@/lib/types/order.types';
import type { ApiResponse } from '@/lib/types/api.types';

/**
 * Get import orders with filters and pagination
 */
export async function getImportOrders(
  params?: ImportOrderQueryParams
): Promise<OrderListResponse<ImportOrderListItem>> {
  const searchParams = new URLSearchParams();
  
  if (params?.q) searchParams.append('q', params.q);
  if (params?.providerId) searchParams.append('providerId', params.providerId.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const url = `/import-orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<OrderListResponse<ImportOrderListItem>>(url);
  return response.data;
}

/**
 * Get import order detail by ID
 */
export async function getImportOrderDetail(
  importOrderId: number
): Promise<ImportOrderDetail> {
  const response = await apiClient.get<ImportOrderDetail>(
    `/import-orders/${importOrderId}`
  );
  return response.data;
}

/**
 * Create new import order
 * POST /api/import-orders
 * Returns: { importOrderId, invoiceNumber }
 */
export async function createImportOrder(
  data: CreateImportOrderRequest
): Promise<CreateImportOrderResponse> {
  const response = await apiClient.post<CreateImportOrderResponse>(
    '/import-orders',
    data
  );
  return response.data;
}

/**
 * Update existing import order
 */
export async function updateImportOrder(
  importOrderId: number,
  data: CreateImportOrderRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.put<ApiResponse<void>>(
    `/import-orders/${importOrderId}`,
    data
  );
  return response.data;
}

/**
 * Delete import order
 */
export async function deleteImportOrder(
  importOrderId: number
): Promise<ApiResponse<void>> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/import-orders/${importOrderId}`
  );
  return response.data;
}

/**
 * Review import order (Approve or Reject)
 * PUT /api/import-orders/{id}/review
 */
export async function reviewImportOrder(
  importOrderId: number,
  approve: boolean,
  notes?: string
): Promise<ApiResponse<any>> {
  const response = await apiClient.put<ApiResponse<any>>(
    `/import-orders/${importOrderId}/review`,
    { approve, notes }
  );
  return response.data;
}

// Legacy functions for backward compatibility
export async function approveImportOrder(
  importOrderId: number,
  data?: ApproveImportOrderRequest
): Promise<ApiResponse<ApprovalResponse>> {
  return reviewImportOrder(importOrderId, true, data?.note);
}

export async function rejectImportOrder(
  importOrderId: number,
  data: RejectImportOrderRequest
): Promise<ApiResponse<ApprovalResponse>> {
  return reviewImportOrder(importOrderId, false, data.reason);
}

/**
 * Get import order statuses with counts
 */
export async function getImportOrderStatuses(
  query?: string
): Promise<ApiResponse<ImportOrderStatusStats[]>> {
  const url = `/import-orders/statuses${query ? `?q=${query}` : ''}`;
  const response = await apiClient.get<ApiResponse<ImportOrderStatusStats[]>>(url);
  return response.data;
}

/**
 * Get providers list from business partners
 * GET /api/business-partners/providers
 */
export async function getProviders(): Promise<Provider[]> {
  const response = await apiClient.get<Provider[]>('/business-partners/providers');
  return response.data;
}

/**
 * Get import order statistics
 */
export async function getImportOrderStatistics(
  from?: string,
  to?: string
): Promise<ApiResponse<ImportOrderStatistics>> {
  const searchParams = new URLSearchParams();
  if (from) searchParams.append('from', from);
  if (to) searchParams.append('to', to);

  const url = `/import-orders/statistics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiResponse<ImportOrderStatistics>>(url);
  return response.data;
}

/**
 * Get provider statistics
 */
export async function getProviderStatistics(
  providerId: number,
  from?: string,
  to?: string
): Promise<ApiResponse<any>> {
  const searchParams = new URLSearchParams();
  if (from) searchParams.append('from', from);
  if (to) searchParams.append('to', to);

  const url = `/import-orders/statistics/provider/${providerId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiResponse<any>>(url);
  return response.data;
}

/**
 * Bulk approve import orders
 */
export async function bulkApproveImportOrders(
  data: BulkApproveRequest
): Promise<ApiResponse<BulkOperationResult>> {
  const response = await apiClient.post<ApiResponse<BulkOperationResult>>(
    '/import-orders/bulk/approve',
    data
  );
  return response.data;
}

/**
 * Bulk delete import orders
 */
export async function bulkDeleteImportOrders(
  data: BulkDeleteRequest
): Promise<ApiResponse<BulkOperationResult>> {
  const response = await apiClient.post<ApiResponse<BulkOperationResult>>(
    '/import-orders/bulk/delete',
    data
  );
  return response.data;
}

/**
 * Export import orders to Excel
 */
export async function exportImportOrdersToExcel(
  params?: ImportOrderQueryParams
): Promise<Blob> {
  const searchParams = new URLSearchParams();
  
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.status) searchParams.append('status', params.status);

  const url = `/import-orders/export${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get(url, {
    responseType: 'blob',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
  return response.data;
}

/**
 * Export import order detail to PDF
 */
export async function exportImportOrderToPDF(
  importOrderId: number
): Promise<Blob> {
  const response = await apiClient.get(`/import-orders/${importOrderId}/export/pdf`, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  });
  return response.data;
}
