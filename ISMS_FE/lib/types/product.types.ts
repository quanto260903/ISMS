// Product Types

export interface Product {
  productId: number;
  serialNumber: string;
  name: string;
  expiredDate?: string;
  unit: string;
  unitPrice: number;
  reorderPoint?: number;
  categoryId?: number;
  categoryName?: string;
  description?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  importPrice?: number;
  exportPrice?: number;
  manufacturingDate?: string;
  batchNumber?: string;
  isActive?: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export interface ProductListItem {
  productId: number;
  serialNumber: string;
  name: string;
  expiredDate?: string;
  unit: string;
  unitPrice: number;
  receivedDate?: string;
  purchasedPrice?: number;
  reorderPoint?: number;
  image?: string;
  description?: string;
  categoryName?: string;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface ProductExpiry {
  productId: number;
  productCode: string;
  productName: string;
  batchNumber?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  stockQuantity: number;
  isExpired: boolean;
}

export interface ProductNearExpired extends ProductExpiry {
  warningLevel: 'danger' | 'warning' | 'info';
}

export interface ProductCategory {
  categoryId: number;
  categoryName: string;
  description?: string;
}

export interface ProductUnit {
  unitId: number;
  unitName: string;
  description?: string;
}

export interface ProductPagedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ProductListItem[];
}

export interface ProductQueryParams {
  q?: string;
  page?: number;
  pageSize?: number;
  categoryId?: number;
  isActive?: boolean;
}

export interface ProductPagedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ProductListItem[];
}

export interface CreateProductRequest {
  productCode: string;
  productName: string;
  categoryId?: number;
  unitId?: number;
  description?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  importPrice?: number;
  exportPrice?: number;
  expiryDate?: string;
  manufacturingDate?: string;
  batchNumber?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  productId: number;
  isActive?: boolean;
}

// Inventory/Stock related
export interface StockLevel {
  productId: number;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  status: 'critical' | 'low' | 'normal' | 'high';
}

export interface StockMovement {
  movementId: number;
  productId: number;
  productName: string;
  movementType: 'import' | 'export' | 'return' | 'adjustment';
  quantity: number;
  referenceId?: number;
  referenceNumber?: string;
  movementDate: string;
  notes?: string;
}
