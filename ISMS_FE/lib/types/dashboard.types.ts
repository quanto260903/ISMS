// ============================================
// DASHBOARD API TYPES
// ============================================

// Common API Response
export interface DashboardApiResponse<T> {
  isSuccess: boolean
  statusCode: number
  message: string
  data: T
}

// ============================================
// 1. TÀI CHÍNH & HIỆU QUẢ
// ============================================

// 1.1 Trend Analysis
export interface TrendAnalysisData {
  date: string
  importValue: number
  exportValue: number
  stockValue: number
  importQuantity: number
  exportQuantity: number
  stockQuantity: number
}

// 1.2 Period Comparison
export interface PeriodComparisonData {
  periodName: string
  startDate: string
  endDate: string
  openingStockValue: number
  openingStockQuantity: number
  closingStockValue: number
  closingStockQuantity: number
  valueGrowthPercent: number
  quantityGrowthPercent: number
  revenue: number
  isCapitalStagnation: boolean
  warning: string
}

// 1.3 Value vs Quantity
export interface ValueVsQuantityData {
  productId: number
  productName: string
  serialNumber: string
  unitCost: number
  totalValue: number
  averageCost: number
  totalQuantity: number
  locationInfo: string
  occupiedSpace: number
}

// ============================================
// 2. VẬN HÀNH & TỐI ƯU
// ============================================

// 2.1 Top 10 Structure (ABC Analysis)
export interface Top10StructureData {
  productId: number
  productName: string
  serialNumber: string
  totalValue: number
  totalQuantity: number
  valuePercentage: number
  cumulativePercentage: number
  category: 'A' | 'B' | 'C'
  managementPriority: string
}

// 2.2 Warehouse Balance
export interface WarehouseBalanceData {
  locationId: number
  locationName: string
  shelfId: string
  totalProducts: number
  totalQuantity: number
  totalValue: number
  capacityUsed: number
  isOverloaded: boolean
  isUnderUtilized: boolean
  transferSuggestions: string[]
}

// ============================================
// 3. QUẢN TRỊ RỦI RO
// ============================================

// 3.1 Minimum Stock Alerts
export interface MinimumStockAlert {
  productId: number
  productName: string
  serialNumber: string
  currentStock: number
  minimumStock: number
  reorderPoint: number
  shortageQuantity: number
  alertLevel: '🔴 CRITICAL' | '🟡 WARNING' | '🟢 OK'
  suggestedOrderQuantity: number
  estimatedCost: number
  leadTimeDays: number
  suggestedOrderDate: string
  supplierId: number
  supplierName: string
}

// 3.2 Expiry Analysis (FEFO)
export interface ExpiryAnalysisData {
  productId: number
  productName: string
  serialNumber: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  quantity: number
  value: number
  locationInfo: string
  expiryStatus: '🔴 CRITICAL' | '🟡 NEAR_EXPIRY' | '🟢 SAFE'
  fefoPriority: 'HIGH' | 'MEDIUM' | 'LOW'
  actionSuggestions: string[]
}

// 3.3 Dead Stock Report
export interface DeadStockData {
  productId: number
  productName: string
  serialNumber: string
  batchNumber: string
  expiryDate: string
  daysOverdue: number
  quantity: number
  originalValue: number
  liquidationValue: number
  totalLoss: number
  locationInfo: string
  responsibleUserId: number | null
  responsibleUserName: string
  responsibleRole: string
  importDate: string
  importOrderId: number
  disposalStatus: string
  disposalMethod: string
}

// ============================================
// 4. TỔNG QUAN
// ============================================

export interface DashboardOverview {
  totalStockValue: number
  monthlyRevenue: number
  valueGrowthRate: number
  totalProducts: number
  totalLocations: number
  averageCapacityUsage: number
  lowStockAlertCount: number
  nearExpiryCount: number
  expiredStockCount: number
  totalPotentialLoss: number
}

// ============================================
// API REQUEST PARAMS
// ============================================

export interface TrendAnalysisParams {
  startDate?: string // yyyy-MM-dd
  endDate?: string // yyyy-MM-dd
}

export interface PeriodComparisonParams {
  periodType: 'month' | 'quarter'
  count: number
}

export interface ExpiryAnalysisParams {
  daysThreshold: number
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

export interface ParetoChartData {
  name: string
  value: number
  percentage: number
  cumulativePercentage: number
  category: 'A' | 'B' | 'C'
}
