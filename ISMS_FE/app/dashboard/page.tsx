'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/lib/types/user.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Dashboard components
import {
  MetricCards,
  TrendChart,
  PeriodComparisonChart,
  ParetoChart,
  WarehouseBalance,
  MinimumStockAlerts,
  ExpiryAlerts,
  DeadStockAlerts,
} from '@/components/dashboard'

// API services
import { dashboardApi } from '@/services/api/dashboard.api'

// Types
import {
  DashboardOverview,
  TrendAnalysisData,
  PeriodComparisonData,
  Top10StructureData,
  WarehouseBalanceData,
  MinimumStockAlert,
  ExpiryAnalysisData,
  DeadStockData,
} from '@/lib/types/dashboard.types'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // State for dashboard data
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [trendData, setTrendData] = useState<TrendAnalysisData[]>([])
  const [periodData, setPeriodData] = useState<PeriodComparisonData[]>([])
  const [top10Data, setTop10Data] = useState<Top10StructureData[]>([])
  const [warehouseData, setWarehouseData] = useState<WarehouseBalanceData[]>([])
  const [stockAlerts, setStockAlerts] = useState<MinimumStockAlert[]>([])
  const [expiryData30, setExpiryData30] = useState<ExpiryAnalysisData[]>([])
  const [expiryData7, setExpiryData7] = useState<ExpiryAnalysisData[]>([])
  const [deadStock, setDeadStock] = useState<DeadStockData[]>([])

  // Period selection
  const [periodType, setPeriodType] = useState<'month' | 'quarter'>('month')

  // Current time for footer (client-side only to avoid hydration error)
  const [currentTime, setCurrentTime] = useState<string>('')

  // Load all dashboard data
  const loadDashboardData = async (showToast = false) => {
    try {
      setRefreshing(true)

      // Calculate date range (last 30 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      // Load all data in parallel
      const [
        overviewRes,
        trendRes,
        periodRes,
        top10Res,
        warehouseRes,
        stockAlertsRes,
        expiry30Res,
        expiry7Res,
        deadStockRes,
      ] = await Promise.all([
        dashboardApi.getDashboardOverview(),
        dashboardApi.getTrendAnalysis({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        dashboardApi.getPeriodComparison({
          periodType,
          count: periodType === 'month' ? 6 : 4,
        }),
        dashboardApi.getTop10Structure(),
        dashboardApi.getWarehouseBalance(),
        dashboardApi.getMinimumStockAlerts(),
        dashboardApi.getExpiryAnalysis({ daysThreshold: 30 }),
        dashboardApi.getExpiryAnalysis({ daysThreshold: 7 }),
        dashboardApi.getDeadStockReport(),
      ])

      // Update state
      if (overviewRes.isSuccess) setOverview(overviewRes.data)
      if (trendRes.isSuccess) setTrendData(trendRes.data)
      if (periodRes.isSuccess) setPeriodData(periodRes.data)
      if (top10Res.isSuccess) setTop10Data(top10Res.data)
      if (warehouseRes.isSuccess) setWarehouseData(warehouseRes.data)
      if (stockAlertsRes.isSuccess) setStockAlerts(stockAlertsRes.data)
      if (expiry30Res.isSuccess) setExpiryData30(expiry30Res.data)
      if (expiry7Res.isSuccess) setExpiryData7(expiry7Res.data)
      if (deadStockRes.isSuccess) setDeadStock(deadStockRes.data)

      // Only show success toast on manual refresh
      if (showToast) {
        toast({
          title: 'Tải dữ liệu thành công',
          description: 'Dashboard đã được cập nhật với dữ liệu mới nhất',
        })
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast({
        title: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải dữ liệu dashboard',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Check user role on mount - redirect if not Admin
  useEffect(() => {
    if (user && user.role !== UserRole.Admin) {
      router.push('/unauthorized')
    }
  }, [user, router])

  // Set current time on client-side only
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }))
  }, [])

  // Load data on mount and when period type changes
  useEffect(() => {
    if (user?.role === UserRole.Admin) {
      loadDashboardData()
    }
  }, [periodType, user])

  // Handle refresh
  const handleRefresh = () => {
    loadDashboardData(true) // Show toast on manual refresh
  }

  // Handle export (placeholder)
  const handleExport = () => {
    toast({
      title: 'Xuất báo cáo',
      description: 'Tính năng đang được phát triển',
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-purple-600" />
          <p className="mt-4 text-gray-500">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard Tổng Quan
          </h1>
          <p className="mt-1 text-gray-500">
            Chào mừng {user?.fullName || 'User'} - Phân tích dữ liệu kho hàng
            toàn diện
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {overview && (
        <section>
          <MetricCards data={overview} />
        </section>
      )}

      {/* Financial Analysis Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Phân Tích Tài Chính & Hiệu Quả</h2>
          <Badge variant="outline" className="ml-2">
            Giám đốc, Kế toán trưởng
          </Badge>
        </div>

        {/* Trend Analysis */}
        {trendData.length > 0 && (
          <TrendChart data={trendData} type="area" />
        )}

        {/* Period Comparison with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                So Sánh Tăng Trưởng Theo Kỳ
              </CardTitle>
              <Tabs
                value={periodType}
                onValueChange={(v) => setPeriodType(v as 'month' | 'quarter')}
              >
                <TabsList>
                  <TabsTrigger value="month">6 Tháng</TabsTrigger>
                  <TabsTrigger value="quarter">4 Quý</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {periodData.length > 0 ? (
              <PeriodComparisonChart
                data={periodData}
                title=""
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Operations Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Vận Hành & Tối Ưu</h2>
          <Badge variant="outline" className="ml-2">
            Thủ kho, Quản lý kho
          </Badge>
        </div>

        {/* Top 10 Structure (Pareto Analysis) */}
        {top10Data.length > 0 && <ParetoChart data={top10Data} />}

        {/* Warehouse Balance */}
        {warehouseData.length > 0 && (
          <WarehouseBalance data={warehouseData} />
        )}
      </section>

      {/* Risk Management Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Quản Trị Rủi Ro</h2>
          <Badge variant="outline" className="ml-2">
            Kiểm soát nội bộ, Mua hàng
          </Badge>
        </div>

        {/* Minimum Stock Alerts */}
        {stockAlerts.length > 0 && (
          <MinimumStockAlerts data={stockAlerts} />
        )}

        {/* Expiry Analysis - Tabs for 7 days and 30 days */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Tích Hạn Sử Dụng (FEFO)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="30days">
              <TabsList className="mb-4">
                <TabsTrigger value="7days" className="gap-2">
                  <Badge variant="destructive" className="h-5 px-2 text-xs">
                    {expiryData7.length}
                  </Badge>
                  7 Ngày (Khẩn cấp)
                </TabsTrigger>
                <TabsTrigger value="30days" className="gap-2">
                  <Badge
                    variant="outline"
                    className="h-5 border-yellow-500 px-2 text-xs text-yellow-500"
                  >
                    {expiryData30.length}
                  </Badge>
                  30 Ngày
                </TabsTrigger>
              </TabsList>
              <TabsContent value="7days">
                <ExpiryAlerts data={expiryData7} daysThreshold={7} />
              </TabsContent>
              <TabsContent value="30days">
                <ExpiryAlerts data={expiryData30} daysThreshold={30} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dead Stock Report */}
        {deadStock.length > 0 && <DeadStockAlerts data={deadStock} />}
      </section>

      {/* Footer Info */}
      <div className="rounded-lg border bg-gray-50 p-4 text-center text-sm text-gray-500">
        Dashboard được cập nhật lúc: {currentTime || 'Đang tải...'}
      </div>
    </div>
  )
}
