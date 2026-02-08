import { apiClient } from '@/lib/api';
import type {
  ReturnReason,
  ReturnReasonQueryParams,
  ReturnStatus,
  ReturnStatusQueryParams,
  ReturnOrder,
  ReturnOrderQueryParams,
  ReturnOrderDetail,
} from '@/lib/types/return.types';
import type { ApiResponse } from '@/lib/types/api.types';

/**
 * Get all return reasons with optional search
 */
export async function getReturnReasons(
  params?: ReturnReasonQueryParams
): Promise<ApiResponse<ReturnReason[]>> {
  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.append('q', params.q);
  }

  const url = `/returns/reasons${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiResponse<ReturnReason[]>>(url);
  return response.data;
}

/**
 * Get return statuses with counts and optional search
 */
export async function getReturnStatuses(
  params?: ReturnStatusQueryParams
): Promise<ApiResponse<ReturnStatus[]>> {
  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.append('q', params.q);
  }

  const url = `/returns/statuses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiResponse<ReturnStatus[]>>(url);
  return response.data;
}

/**
 * Get return orders with filters
 */
export async function getReturnOrders(
  params?: ReturnOrderQueryParams
): Promise<ApiResponse<ReturnOrder[]>> {
  const searchParams = new URLSearchParams();
  
  if (params?.q) searchParams.append('q', params.q);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.exportOrderId) searchParams.append('exportOrderId', params.exportOrderId.toString());
  if (params?.checkedBy) searchParams.append('checkedBy', params.checkedBy.toString());
  if (params?.reviewedBy) searchParams.append('reviewedBy', params.reviewedBy.toString());
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const url = `/returns/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiResponse<ReturnOrder[]>>(url);
  return response.data;
}

/**
 * Get return order detail by ID
 */
export async function getReturnOrderDetail(
  returnOrderId: number
): Promise<ApiResponse<ReturnOrderDetail>> {
  const response = await apiClient.get<ApiResponse<ReturnOrderDetail>>(
    `/returns/orders/${returnOrderId}`
  );
  return response.data;
}
