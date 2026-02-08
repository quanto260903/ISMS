'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { PeriodComparisonData } from '@/lib/types/dashboard.types'
import { CalendarRange, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PeriodComparisonChartProps {
  data: PeriodComparisonData[]
  title?: string
}

export function PeriodComparisonChart({
  data,
  title = 'So Sánh Tăng Trưởng Theo Kỳ',
}: PeriodComparisonChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    period: item.periodName,
    'Giá Trị Đầu Kỳ': item.openingStockValue / 1000000,
    'Giá Trị Cuối Kỳ': item.closingStockValue / 1000000,
    'Doanh Thu': item.revenue / 1000000,
    'Tăng Trưởng': item.valueGrowthPercent,
    isStagnation: item.isCapitalStagnation,
    warning: item.warning,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-white p-4 shadow-lg">
          <p className="mb-2 font-semibold">{label}</p>
          {payload.slice(0, 3).map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value * 1000000)}
            </p>
          ))}
          <div className="mt-2 border-t pt-2">
            <p
              className={`font-semibold ${
                data['Tăng Trưởng'] >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Tăng trưởng: {data['Tăng Trưởng'].toFixed(1)}%
            </p>
            {data.isStagnation && (
              <div className="mt-1 flex items-start gap-1 text-xs text-orange-600">
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>{data.warning}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Count warnings
  const warningCount = data.filter((d) => d.isCapitalStagnation).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-purple-600" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {warningCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} cảnh báo
              </Badge>
            )}
            <div className="text-sm text-gray-500">(Đơn vị: Triệu VNĐ)</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="Giá Trị Đầu Kỳ"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Giá Trị Cuối Kỳ"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isStagnation ? '#f59e0b' : '#8b5cf6'}
                />
              ))}
            </Bar>
            <Bar
              dataKey="Doanh Thu"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Warning Summary */}
        {warningCount > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo ứ đọng vốn
            </h4>
            {data
              .filter((d) => d.isCapitalStagnation)
              .map((d, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                >
                  <p className="text-sm font-medium">{d.periodName}</p>
                  <p className="text-xs text-gray-600">{d.warning}</p>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
