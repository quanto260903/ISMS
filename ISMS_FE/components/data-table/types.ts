import { ReactNode } from 'react'

// Column definition
export interface DataTableColumn<T> {
  key: string
  header: string | ReactNode
  cell: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

// Filter definition
export interface DataTableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange'
  placeholder?: string
  options?: { label: string; value: string }[]
  defaultValue?: string
}

// Sort configuration
export interface DataTableSort {
  key: string
  direction: 'asc' | 'desc'
}

// Pagination info
export interface DataTablePagination {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// Table actions
export interface DataTableAction<T> {
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'ghost' | 'destructive' | 'outline'
  show?: (row: T) => boolean
}

// Main props
export interface DataTableProps<T> {
  // Data
  data: T[]
  columns: DataTableColumn<T>[]
  keyField: keyof T
  
  // Loading & Empty states
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  
  // Search
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  
  // Filters
  filters?: DataTableFilter[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  
  // Sorting
  sortable?: boolean
  sortConfig?: DataTableSort
  onSortChange?: (sort: DataTableSort) => void
  
  // Pagination
  pagination?: DataTablePagination
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  enablePagination?: boolean // Control whether to show pagination
  
  // Actions
  actions?: DataTableAction<T>[]
  bulkActions?: {
    label: string
    icon?: ReactNode
    onClick: (selectedRows: T[]) => void
    variant?: 'default' | 'destructive'
  }[]
  
  // Selection
  selectable?: boolean
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  
  // Styling
  className?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string | ((row: T) => string)
  
  // Behavior
  onRowClick?: (row: T) => void
  hoverable?: boolean
  striped?: boolean
}
