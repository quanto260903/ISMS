'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AISearchResultTableProps {
  data: any[]
  columnMapping?: { [key: string]: string }
}

export function AISearchResultTable({
  data,
  columnMapping,
}: AISearchResultTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Không có dữ liệu
      </div>
    )
  }

  // Get column keys from first row, excluding objects and arrays
  const sampleRow = data[0]
  
  const columns = Object.keys(sampleRow).filter((key) => {
    const value = sampleRow[key]
    // Only include primitive types (exclude objects and arrays)
    const isPrimitive = 
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    
    // Exclude array even if empty
    const isNotArray = !Array.isArray(value)
    
    return isPrimitive && isNotArray
  })

  // Format column label - use columnMapping if provided
  const formatLabel = (key: string): string => {
    // First priority: use provided columnMapping
    if (columnMapping && columnMapping[key]) {
      return columnMapping[key]
    }
    
    // Fallback: default translations for common keys
    const translations: { [key: string]: string } = {
      ProductID: 'Mã SP',
      Name: 'Tên sản phẩm',
      SerialNumber: 'Số serial',
      Unit: 'Đơn vị',
      UnitPrice: 'Đơn giá',
      ExpiredDate: 'Hạn SD',
      ReceivedDate: 'Ngày nhận',
      Description: 'Mô tả',
      productName: 'Tên sản phẩm',
      totalAvailable: 'Khả dụng',
      totalAllocated: 'Đã phân bổ',
      totalInStock: 'Tổng tồn',
    }
    return translations[key] || key
  }

  // Format cell value with proper Vietnamese formatting
  const formatValue = (value: any, key: string) => {
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>
    }

    if (typeof value === 'number') {
      // Check if column name indicates currency (VNĐ)
      const columnLabel = columnMapping?.[key] || key
      const isCurrency = columnLabel.includes('VNĐ') || 
                        columnLabel.includes('Giá') || 
                        key.toLowerCase().includes('price') ||
                        key.toLowerCase().includes('value')
      
      // Check if it's a percentage
      const isPercentage = columnLabel.includes('%') || 
                          key.toLowerCase().includes('percentage') ||
                          key.toLowerCase().includes('rate')
      
      if (isCurrency) {
        return (
          <span className="font-medium text-green-700">
            {value.toLocaleString('vi-VN')} ₫
          </span>
        )
      }
      
      if (isPercentage) {
        return (
          <span className="font-medium text-blue-700">
            {value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </span>
        )
      }
      
      return (
        <span className="font-medium text-gray-900">
          {value.toLocaleString('vi-VN')}
        </span>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Có' : 'Không'}
        </Badge>
      )
    }

    // Handle dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return (
            <span className="text-gray-700">
              {date.toLocaleDateString('vi-VN')}
            </span>
          )
        }
      } catch {}
    }

    // Truncate long text
    const strValue = String(value)
    if (strValue.length > 50) {
      return (
        <span className="text-gray-700" title={strValue}>
          {strValue.substring(0, 50)}...
        </span>
      )
    }

    return <span className="text-gray-700">{strValue}</span>
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 text-center">#</TableHead>
                {columns.map((key) => (
                  <TableHead key={key} className="font-semibold">
                    {formatLabel(key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="text-center text-gray-500 font-medium">
                    {index + 1}
                  </TableCell>
                  {columns.map((key) => (
                    <TableCell key={key}>
                      {formatValue(row[key], key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
