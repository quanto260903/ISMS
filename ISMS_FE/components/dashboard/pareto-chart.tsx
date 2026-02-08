'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Top10StructureData } from '@/lib/types/dashboard.types'
import { TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ParetoChartProps {
  data: Top10StructureData[]
  title?: string
}

const CATEGORY_COLORS = {
  A: '#ef4444', // red-500
  B: '#f59e0b', // amber-500
  C: '#10b981', // green-500
}

const CATEGORY_LABELS = {
  A: '🔴 Nhóm A - Ưu tiên cao',
  B: '🟡 Nhóm B - Ưu tiên trung bình',
  C: '🟢 Nhóm C - Ưu tiên thấp',
}

export function ParetoChart({
  data,
  title = 'Phân Tích ABC - Quy Luật 80/20',
}: ParetoChartProps) {
  // Format data for Pareto chart
  const chartData = data.map((item) => ({
    name: item.productName.length > 20
      ? item.productName.substring(0, 20) + '...'
      : item.productName,
    fullName: item.productName,
    'Giá Trị': item.totalValue / 1000000,
    'Tỷ Trọng (%)': item.valuePercentage,
    'Tích Lũy (%)': item.cumulativePercentage,
    category: item.category,
    priority: item.managementPriority,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-white p-4 shadow-lg">
          <p className="mb-2 font-semibold">{data.fullName}</p>
          <p className="text-sm text-purple-600">
            Giá trị: {formatCurrency(data['Giá Trị'] * 1000000)}
          </p>
          <p className="text-sm text-blue-600">
            Tỷ trọng: {data['Tỷ Trọng (%)'].toFixed(1)}%
          </p>
          <p className="text-sm text-orange-600">
            Tích lũy: {data['Tích Lũy (%)'].toFixed(1)}%
          </p>
          <div className="mt-2 border-t pt-2">
            <Badge
              variant="outline"
              style={{
                borderColor: CATEGORY_COLORS[data.category as keyof typeof CATEGORY_COLORS],
                color: CATEGORY_COLORS[data.category as keyof typeof CATEGORY_COLORS],
              }}
            >
              {CATEGORY_LABELS[data.category as keyof typeof CATEGORY_LABELS]}
            </Badge>
            <p className="mt-1 text-xs text-gray-600">{data.priority}</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Count by category
  const categoryStats = {
    A: data.filter((d) => d.category === 'A').length,
    B: data.filter((d) => d.category === 'B').length,
    C: data.filter((d) => d.category === 'C').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-red-500 text-red-500">
              A: {categoryStats.A}
            </Badge>
            <Badge variant="outline" className="border-amber-500 text-amber-500">
              B: {categoryStats.B}
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-500">
              C: {categoryStats.C}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Top 10 sản phẩm theo giá trị - Phân loại ABC theo quy luật Pareto
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              label={{
                value: 'Giá trị (Triệu VNĐ)',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              label={{
                value: 'Tích lũy (%)',
                angle: 90,
                position: 'insideRight',
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="Giá Trị"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]}
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Tích Lũy (%)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="font-semibold text-red-700">Nhóm A</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Chiếm ~80% giá trị, cần kiểm soát chặt chẽ
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-700">Nhóm B</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Chiếm ~15% giá trị, kiểm soát định kỳ
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="font-semibold text-green-700">Nhóm C</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Chiếm ~5% giá trị, kiểm soát cơ bản
            </p>
          </div>
        </div>
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
