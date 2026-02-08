'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AISearchResultTable } from '@/components/ai-search-result-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { aiSearchApi, AISearchResult } from '@/services/api/ai-search.api'
import { Package, Warehouse, TrendingUp, ChevronDown, ChevronUp, Code, Sparkles } from 'lucide-react'

export default function AISearchPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [searchResult, setSearchResult] = useState<AISearchResult | null>(null)
  const [expandedSql, setExpandedSql] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Auto search when query parameter exists
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      handleSearch(q)
    }
  }, [searchParams])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await aiSearchApi.search(searchQuery)
      
      if (response.isSuccess && response.data) {
        setSearchResult(response.data)
        toast({
          title: '✅ Tìm kiếm thành công',
          description: response.message || `Tìm thấy ${response.data.result.length} kết quả`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Không tìm thấy kết quả',
          description: response.message || 'Vui lòng thử lại với từ khóa khác',
        })
        setSearchResult(null)
      }
    } catch (error: any) {
      console.error('AI Search error:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi tìm kiếm',
        description: error.message || 'Có lỗi xảy ra khi tìm kiếm',
      })
      setSearchResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSql = (index: number) => {
    setExpandedSql((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Format number with commas
  const formatNumber = (num: number | undefined) => {
    return num?.toLocaleString('vi-VN') || '0'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Search - Kết quả tìm kiếm
        </h1>
        <p className="text-gray-500 mt-2">
          Kết quả tìm kiếm thông minh từ hệ thống AI. Sử dụng thanh tìm kiếm trên header để thực hiện truy vấn mới.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-purple-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Đang tìm kiếm...</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResult && !isLoading && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng kết quả</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  {formatNumber(searchResult.result.length)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Bản ghi tìm thấy</p>
              </CardContent>
            </Card>

            <Card className="border-teal-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng vị trí kho</CardTitle>
                <Warehouse className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-700">
                  {searchResult.result[0]?.SystemTotalLocations ? formatNumber(searchResult.result[0].SystemTotalLocations) : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Vị trí trong hệ thống</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số lượng</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {searchResult.result[0]?.SystemTotalQuantity ? formatNumber(searchResult.result[0].SystemTotalQuantity) : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Sản phẩm toàn kho</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">
                  {searchResult.result[0]?.SystemTotalValue 
                    ? `${formatNumber(searchResult.result[0].SystemTotalValue / 1000000)}M`
                    : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">VNĐ</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Kết quả tìm kiếm</CardTitle>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Danh sách vị trí kho
                    </Badge>
                    <Badge variant="secondary">{formatNumber(searchResult.result.length)} bản ghi</Badge>
                  </div>
                  <CardDescription>
                    Thông tin chi tiết về các vị trí kho trong hệ thống
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSql(0)}
                  className="text-gray-500 hover:text-purple-600"
                >
                  <Code className="mr-2 h-4 w-4" />
                  {expandedSql[0] ? (
                    <>
                      Ẩn SQL <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Xem SQL <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* SQL Query Display */}
              {expandedSql[0] && searchResult.sql && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto">
                  <code className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {searchResult.sql}
                  </code>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {searchResult.result.length > 0 ? (
                <AISearchResultTable
                  data={searchResult.result}
                  columnMapping={searchResult.columnMapping}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Info */}
          {searchResult.metadata && (
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Thông tin truy vấn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Used Tables */}
                {searchResult.metadata.validation?.used_tables && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Bảng sử dụng:</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.metadata.validation.used_tables.map((table, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Assumptions */}
                {searchResult.metadata.validation?.assumptions && searchResult.metadata.validation.assumptions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Giả định:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {searchResult.metadata.validation.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-xs text-gray-600">{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!searchResult && !isLoading && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gradient-to-r from-purple-100 to-teal-100 p-6 mb-4">
              <Sparkles className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có kết quả tìm kiếm
            </h3>
            <p className="text-gray-500 max-w-md">
              Sử dụng thanh tìm kiếm ở phía trên header để thực hiện truy vấn.
              Bạn có thể sử dụng giọng nói (microphone) hoặc nhập văn bản.
            </p>
            <p className="text-gray-400 text-sm mt-2 italic">
              Ví dụ: "Liệt kê trong kho có bao nhiêu sản phẩm"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
