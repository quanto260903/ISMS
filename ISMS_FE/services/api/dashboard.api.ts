import apiClient from '@/lib/api'
import {
  DashboardApiResponse,
  TrendAnalysisData,
  PeriodComparisonData,
  ValueVsQuantityData,
  Top10StructureData,
  WarehouseBalanceData,
  MinimumStockAlert,
  ExpiryAnalysisData,
  DeadStockData,
  DashboardOverview,
  TrendAnalysisParams,
  PeriodComparisonParams,
  ExpiryAnalysisParams,
} from '@/lib/types/dashboard.types'

// ============================================
// 1. TÀI CHÍNH & HIỆU QUẢ
// ============================================

/**
 * Phân tích xu hướng - Nhìn thấy "mùa vụ" kinh doanh
 */
export const getTrendAnalysis = async (
  params?: TrendAnalysisParams
): Promise<DashboardApiResponse<TrendAnalysisData[]>> => {
  const { data } = await apiClient.get('/Dashboard/finance/trend-analysis', {
    params,
  })
  return data
}

/**
 * So sánh tăng trưởng theo tháng/quý
 */
export const getPeriodComparison = async (
  params: PeriodComparisonParams
): Promise<DashboardApiResponse<PeriodComparisonData[]>> => {
  const { data } = await apiClient.get('/Dashboard/finance/period-comparison', {
    params,
  })
  return data
}

/**
 * Phân tích Giá trị vs Số lượng
 */
export const getValueVsQuantity = async (): Promise<
  DashboardApiResponse<ValueVsQuantityData[]>
> => {
  const { data } = await apiClient.get('/Dashboard/finance/value-vs-quantity')
  return data
}

// ============================================
// 2. VẬN HÀNH & TỐI ƯU
// ============================================

/**
 * Phân tích cấu trúc Top 10 (Quy luật 80/20 - ABC Analysis)
 */
export const getTop10Structure = async (): Promise<
  DashboardApiResponse<Top10StructureData[]>
> => {
  const { data } = await apiClient.get('/Dashboard/operations/top10-structure')
  return data
}

/**
 * Phân tích cân bằng kho
 */
export const getWarehouseBalance = async (): Promise<
  DashboardApiResponse<WarehouseBalanceData[]>
> => {
  const { data } = await apiClient.get(
    '/Dashboard/operations/warehouse-balance'
  )
  return data
}

// ============================================
// 3. QUẢN TRỊ RỦI RO
// ============================================

/**
 * Cảnh báo tồn kho tối thiểu - Gợi ý đặt hàng
 */
export const getMinimumStockAlerts = async (): Promise<
  DashboardApiResponse<MinimumStockAlert[]>
> => {
  const { data } = await apiClient.get('/Dashboard/risk/minimum-stock-alerts')
  return data
}

/**
 * Phân tích hạn sử dụng (FEFO)
 */
export const getExpiryAnalysis = async (
  params: ExpiryAnalysisParams
): Promise<DashboardApiResponse<ExpiryAnalysisData[]>> => {
  const { data } = await apiClient.get('/Dashboard/risk/expiry-analysis', {
    params,
  })
  return data
}

/**
 * Báo cáo hàng quá hạn (Dead Stock)
 */
export const getDeadStockReport = async (): Promise<
  DashboardApiResponse<DeadStockData[]>
> => {
  const { data } = await apiClient.get('/Dashboard/risk/dead-stock-report')
  return data
}

// ============================================
// 4. TỔNG QUAN
// ============================================

/**
 * Dashboard tổng quan - Tất cả chỉ số chính
 */
export const getDashboardOverview = async (): Promise<
  DashboardApiResponse<DashboardOverview>
> => {
  const { data } = await apiClient.get('/Dashboard/overview')
  return data
}

// Export all as dashboardApi object
export const dashboardApi = {
  // Finance
  getTrendAnalysis,
  getPeriodComparison,
  getValueVsQuantity,

  // Operations
  getTop10Structure,
  getWarehouseBalance,

  // Risk
  getMinimumStockAlerts,
  getExpiryAnalysis,
  getDeadStockReport,

  // Overview
  getDashboardOverview,
}
