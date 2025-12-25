'use client'

import { useState, Fragment, ReactNode } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  Row,
  ExpandedState,
  getExpandedRowModel,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableToolbar } from './DataTableToolbar'
import { DataTablePagination } from './DataTablePagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  // Filtering
  enableFiltering?: boolean
  enableGlobalFilter?: boolean
  filterableColumns?: string[]
  // Sorting
  enableSorting?: boolean
  defaultSorting?: SortingState
  // Pagination
  enablePagination?: boolean
  pageSize?: number
  // Expandable rows
  getRowCanExpand?: (row: Row<TData>) => boolean
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode
  // Custom row click handler
  onRowClick?: (row: Row<TData>) => void
  // Empty state
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  // Toolbar customization
  toolbarExtra?: ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  enableFiltering = true,
  enableGlobalFilter = true,
  filterableColumns = [],
  enableSorting = true,
  defaultSorting = [],
  enablePagination = true,
  pageSize = 25,
  getRowCanExpand,
  renderSubComponent,
  onRowClick,
  emptyIcon = '📊',
  emptyTitle = 'No Results',
  emptyDescription = 'No data to display.',
  toolbarExtra,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,
    getExpandedRowModel: getRowCanExpand ? getExpandedRowModel() : undefined,
    getRowCanExpand,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
              <div className="w-8 h-8 bg-stone-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-3 bg-stone-100 rounded w-1/4" />
              </div>
              <div className="w-24 h-6 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(enableGlobalFilter || filterableColumns.length > 0 || toolbarExtra) && (
        <DataTableToolbar
          table={table}
          enableGlobalFilter={enableGlobalFilter}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          filterableColumns={filterableColumns}
          toolbarExtra={toolbarExtra}
        />
      )}

      <div className="card overflow-hidden">
        {table.getRowModel().rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">{emptyIcon}</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">{emptyTitle}</h3>
            <p className="text-stone-500">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stone-200 text-left text-sm text-stone-500">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    className={cn(
                      'border-b border-stone-100 hover:bg-stone-50 transition-colors',
                      (onRowClick || getRowCanExpand?.(row)) && 'cursor-pointer',
                      row.getIsExpanded() && 'bg-stone-50'
                    )}
                    onClick={() => {
                      if (onRowClick) {
                        onRowClick(row)
                      } else if (getRowCanExpand?.(row)) {
                        row.toggleExpanded()
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <td colSpan={row.getVisibleCells().length}>
                        {renderSubComponent({ row })}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {enablePagination && table.getRowModel().rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  )
}
