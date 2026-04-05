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
  Sparkles,
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
    if (user && Number(user.role) !== UserRole.Admin) {
      router.push('/unauthorized')
    }
  }, [user, router])

  // Set current time on client-side only
  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleString('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    )
  }, [])

  // Load data on mount and when period type changes
  useEffect(() => {
    if (user && Number(user.role) === UserRole.Admin) {
      loadDashboardData()
    }
  }, [periodType, user])

  const handleRefresh = () => loadDashboardData(true)

  const handleExport = () => {
    toast({
      title: 'Xuất báo cáo',
      description: 'Tính năng đang được phát triển',
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Multi-layer animated rings */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-200" />
            <div
              className="absolute inset-1 animate-spin rounded-full border-4 border-transparent border-t-purple-600"
              style={{ animationDuration: '0.8s' }}
            />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Đang tải Dashboard...</p>
            <p className="mt-1 text-xs text-gray-400">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-5 shadow-lg">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-200">
                WMS Pro · Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Chào mừng,{' '}
              <span className="text-purple-200">{user?.fullName || 'Admin'}</span> 👋
            </h1>
            <p className="mt-1 text-sm text-purple-200">
              {currentTime || 'Đang tải...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* ── Overview Metrics ─────────────────────────────────── */}
      {overview && (
        <section>
          <MetricCards data={overview} />
        </section>
      )}

      {/* ── Financial Analysis ────────────────────────────────── */}
      <section className="space-y-5">
        <div className="dashboard-section-header border-purple-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Phân Tích Tài Chính &amp; Hiệu Quả</h2>
            <p className="text-xs text-gray-400">Dành cho Giám đốc, Kế toán trưởng</p>
          </div>
        </div>

        {/* Trend Analysis */}
        {trendData.length > 0 && <TrendChart data={trendData} type="area" />}

        {/* Period Comparison */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-purple-600/10 via-purple-500/5 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-blue-600 shadow-md">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                So Sánh Tăng Trưởng Theo Kỳ
              </CardTitle>
              <Tabs
                value={periodType}
                onValueChange={(v) => setPeriodType(v as 'month' | 'quarter')}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="month" className="h-6 px-3 text-xs">6 Tháng</TabsTrigger>
                  <TabsTrigger value="quarter" className="h-6 px-3 text-xs">4 Quý</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <CardContent className="pt-2">
            {periodData.length > 0 ? (
              <PeriodComparisonChart data={periodData} title="" />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Calendar className="mb-2 h-10 w-10 text-gray-200" />
                <p className="text-sm">Không có dữ liệu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Operations ────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="dashboard-section-header border-teal-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 shadow-md">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Vận Hành &amp; Tối Ưu</h2>
            <p className="text-xs text-gray-400">Dành cho Thủ kho, Quản lý kho</p>
          </div>
        </div>

        {top10Data.length > 0 && <ParetoChart data={top10Data} />}
        {warehouseData.length > 0 && <WarehouseBalance data={warehouseData} />}
      </section>

      {/* ── Risk Management ───────────────────────────────────── */}
      <section className="space-y-5">
        <div className="dashboard-section-header border-orange-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quản Trị Rủi Ro</h2>
            <p className="text-xs text-gray-400">Dành cho Kiểm soát nội bộ, Mua hàng</p>
          </div>
        </div>

        {stockAlerts.length > 0 && <MinimumStockAlerts data={stockAlerts} />}

        {/* Expiry Analysis */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 shadow-md">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Phân Tích Hạn Sử Dụng (FEFO)
            </CardTitle>
          </div>
          <CardContent className="pt-2">
            <Tabs defaultValue="30days">
              <TabsList className="mb-4 h-8">
                <TabsTrigger value="7days" className="h-6 gap-2 px-3 text-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {expiryData7.length}
                  </span>
                  7 Ngày (Khẩn cấp)
                </TabsTrigger>
                <TabsTrigger value="30days" className="h-6 gap-2 px-3 text-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                    {expiryData30.length}
                  </span>
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

        {deadStock.length > 0 && <DeadStockAlerts data={deadStock} />}
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-purple-50 py-3 text-xs font-medium text-gray-400 shadow-sm">
        <RefreshCw className="h-3 w-3 text-purple-400" />
        Dashboard cập nhật lúc:{' '}
        <span className="font-semibold text-purple-600">{currentTime || 'Đang tải...'}</span>
      </div>
    </div>
  )
}
