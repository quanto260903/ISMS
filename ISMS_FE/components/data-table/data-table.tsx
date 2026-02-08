'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DataTableProps, DataTableColumn } from './types'
import { DataTablePagination } from './pagination'

export type { DataTableColumn } from './types'

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  emptyIcon,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  sortable = false,
  sortConfig,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  enablePagination = true,
  actions = [],
  bulkActions = [],
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
  hoverable = true,
  striped = false,
}: DataTableProps<T>) {
  const [localSelectedRows, setLocalSelectedRows] = useState<T[]>(selectedRows)

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? data : []
    setLocalSelectedRows(newSelected)
    onSelectionChange?.(newSelected)
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = checked
      ? [...localSelectedRows, row]
      : localSelectedRows.filter((r) => r[keyField] !== row[keyField])
    setLocalSelectedRows(newSelected)
    onSelectionChange?.(newSelected)
  }

  const isRowSelected = (row: T) => {
    return localSelectedRows.some((r) => r[keyField] === row[keyField])
  }

  const handleSort = (column: DataTableColumn<T>) => {
    if (!sortable || !column.sortable || !onSortChange) return

    const newDirection =
      sortConfig?.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

    onSortChange({ key: column.key, direction: newDirection })
  }

  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!sortable || !column.sortable) return null

    if (sortConfig?.key !== column.key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const getRowClassName = (row: T, index: number) => {
    const classes = []

    if (hoverable) classes.push('hover:bg-gray-50 cursor-pointer')
    if (striped && index % 2 === 1) classes.push('bg-gray-50/50')
    if (isRowSelected(row)) classes.push('bg-purple-50')

    if (typeof rowClassName === 'function') {
      classes.push(rowClassName(row))
    } else if (rowClassName) {
      classes.push(rowClassName)
    }

    return cn(classes)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header: Search, Filters, Bulk Actions */}
      {(searchable || filters.length > 0 || bulkActions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tìm kiếm & Lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search */}
              {searchable && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Filters */}
              {filters.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {filters.map((filter) => {
                    if (filter.type === 'select') {
                      return (
                        <Select
                          key={filter.key}
                          value={filterValues[filter.key] || filter.defaultValue || ''}
                          onValueChange={(value) => onFilterChange?.(filter.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={filter.placeholder || filter.label} />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    }

                    if (filter.type === 'date') {
                      return (
                        <Input
                          key={filter.key}
                          type="date"
                          placeholder={filter.placeholder}
                          value={filterValues[filter.key] || ''}
                          onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                        />
                      )
                    }

                    return (
                      <Input
                        key={filter.key}
                        type="text"
                        placeholder={filter.placeholder || filter.label}
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                      />
                    )
                  })}
                </div>
              )}

              {/* Bulk Actions */}
              {bulkActions.length > 0 && localSelectedRows.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-500">
                    Đã chọn {localSelectedRows.length} mục
                  </span>
                  {bulkActions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      size="sm"
                      onClick={() => action.onClick(localSelectedRows)}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              {emptyIcon}
              <p className="text-gray-500 mt-2">{emptyMessage}</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className={tableClassName}>
                <TableHeader className={headerClassName}>
                  <TableRow>
                    {selectable && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={localSelectedRows.length === data.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          column.headerClassName,
                          sortable && column.sortable && 'cursor-pointer select-none'
                        )}
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center">
                          {column.header}
                          {getSortIcon(column)}
                        </div>
                      </TableHead>
                    ))}
                    {actions.length > 0 && (
                      <TableHead className="text-right">Thao tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow
                      key={String(row[keyField])}
                      className={getRowClassName(row, index)}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isRowSelected(row)}
                            onCheckedChange={(checked) =>
                              handleSelectRow(row, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {actions.map((action, actionIndex) => {
                              if (action.show && !action.show(row)) return null

                              return (
                                <Button
                                  key={actionIndex}
                                  variant={action.variant || 'ghost'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick(row)
                                  }}
                                >
                                  {action.icon}
                                  {action.label}
                                </Button>
                              )
                            })}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination - Inside Card */}
          {enablePagination && pagination && (
            <div className="border-t">
              <DataTablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                onPageChange={(page) => onPageChange?.(page)}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={pageSizeOptions}
                showPageSizeSelector={true}
                showPageInfo={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
