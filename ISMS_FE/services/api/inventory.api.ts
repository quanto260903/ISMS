// ===== Inventory API Service =====

import apiClient from '@/lib/api'
import type {
  InventoryResponse,
  InventoryDashboardDto,
  InventoryStatusSummaryDto,
  ProductInventoryDto,
  AddInventoryRequest,
  UpdateInventoryRequest,
} from '@/lib/types/inventory.types'

/**
 * GET /api/inventory/All
 * Lấy danh sách tất cả các bản ghi inventory
 */
export async function getAllInventory(): Promise<InventoryResponse[]> {
  try {
    const response = await apiClient.get<InventoryResponse[]>('/inventory/All')
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching all inventory:', error)
    throw error
  }
}

/**
 * GET /api/inventory/{inventoryId}
 * Lấy chi tiết inventory theo InventoryId
 */
export async function getInventoryById(inventoryId: number): Promise<InventoryResponse> {
  try {
    const response = await apiClient.get<InventoryResponse>(`/inventory/${inventoryId}`)
    return response.data
  } catch (error: any) {
    console.error(`❌ Error fetching inventory ${inventoryId}:`, error)
    throw error
  }
}

/**
 * GET /api/inventory/productId/{productId}
 * Lấy inventory của một sản phẩm cụ thể
 */
export async function getInventoryByProductId(productId: number): Promise<InventoryResponse[]> {
  try {
    const response = await apiClient.get<InventoryResponse[]>(`/inventory/productId/${productId}`)
    return response.data
  } catch (error: any) {
    console.error(`❌ Error fetching inventory for product ${productId}:`, error)
    throw error
  }
}

/**
 * GET /api/inventory/dashboard
 * Lấy thông tin tổng quan dashboard
 */
export async function getInventoryDashboard(): Promise<InventoryDashboardDto> {
  try {
    const response = await apiClient.get<InventoryDashboardDto>('/inventory/dashboard')
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching inventory dashboard:', error)
    throw error
  }
}

/**
 * GET /api/inventory/status-summary
 * Thống kê tồn kho theo trạng thái
 */
export async function getInventoryStatusSummary(): Promise<InventoryStatusSummaryDto> {
  try {
    const response = await apiClient.get<InventoryStatusSummaryDto>('/inventory/status-summary')
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching inventory status summary:', error)
    throw error
  }
}

/**
 * GET /api/inventory/products
 * Lấy danh sách tất cả sản phẩm kèm thông tin tồn kho chi tiết (MAIN API)
 */
export async function getProductInventoryList(): Promise<ProductInventoryDto[]> {
  try {
    const response = await apiClient.get<ProductInventoryDto[]>('/inventory/products')
    return response.data
  } catch (error: any) {
    console.error('❌ Error fetching product inventory list:', error)
    throw error
  }
}

/**
 * POST /api/inventory
 * Thêm inventory mới
 */
export async function addInventory(data: AddInventoryRequest): Promise<InventoryResponse> {
  try {
    const response = await apiClient.post<InventoryResponse>('/inventory', data)
    return response.data
  } catch (error: any) {
    console.error('❌ Error adding inventory:', error)
    throw error
  }
}

/**
 * PUT /api/inventory/{inventoryId}
 * Cập nhật inventory
 */
export async function updateInventory(
  inventoryId: number,
  data: UpdateInventoryRequest
): Promise<InventoryResponse> {
  try {
    const response = await apiClient.put<InventoryResponse>(
      `/inventory/${inventoryId}`,
      data
    )
    return response.data
  } catch (error: any) {
    console.error(`❌ Error updating inventory ${inventoryId}:`, error)
    throw error
  }
}

/**
 * DELETE /api/inventory/{inventoryId}
 * Xóa inventory
 */
export async function deleteInventory(inventoryId: number): Promise<void> {
  try {
    await apiClient.delete(`/inventory/${inventoryId}`)
  } catch (error: any) {
    console.error(`❌ Error deleting inventory ${inventoryId}:`, error)
    throw error
  }
}