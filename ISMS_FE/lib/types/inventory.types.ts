// ===== Inventory Types =====

/**
 * Response từ API /api/inventory/All hoặc chi tiết inventory
 */
export interface InventoryResponse {
  inventoryId: number
  productId: number
  locationId: number
  quantityAvailable: number
  allocatedQuantity: number
}

/**
 * Response từ API /api/inventory/dashboard
 */
export interface InventoryDashboardDto {
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
  inventoryTurnoverRate: number
}

/**
 * Response từ API /api/inventory/status-summary
 */
export interface InventoryStatusSummaryDto {
  available: number
  allocated: number
  damaged: number
  inTransit: number
}

/**
 * Response từ API /api/inventory/products (Main list)
 */
export interface ProductInventoryDto {
  productId: number
  productName: string
  totalStock: number
  available: number
  allocated: number
  damaged: number
  inTransit: number
}

/**
 * Request body cho POST /api/inventory
 */
export interface AddInventoryRequest {
  productId: number
  locationId: number
  quantityAvailable: number
  allocatedQuantity: number
}

/**
 * Request body cho PUT /api/inventory/{inventoryId}
 */
export interface UpdateInventoryRequest {
  quantityAvailable: number
  allocatedQuantity: number
}

/**
 * Filter params for inventory list
 */
export interface InventoryFilterParams {
  searchQuery?: string
  minStock?: number
  maxStock?: number
  status?: 'all' | 'available' | 'low' | 'out'
}
