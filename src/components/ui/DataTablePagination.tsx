'use client'

import { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-stone-500">
        Showing{' '}
        <span className="font-medium text-stone-700">
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
        </span>
        {' '}-{' '}
        <span className="font-medium text-stone-700">
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}
        </span>
        {' '}of{' '}
        <span className="font-medium text-stone-700">
          {table.getFilteredRowModel().rows.length}
        </span>
        {' '}results
      </div>

      <div className="flex items-center gap-2">
        {/* Page size selector */}
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1.5 text-sm border border-stone-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              'p-1.5 rounded border border-stone-200 hover:bg-stone-50 transition-colors',
              !table.getCanPreviousPage() && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )}
            title="First page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              'p-1.5 rounded border border-stone-200 hover:bg-stone-50 transition-colors',
              !table.getCanPreviousPage() && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )}
            title="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="px-3 text-sm text-stone-600">
            Page{' '}
            <span className="font-medium text-stone-900">
              {table.getState().pagination.pageIndex + 1}
            </span>
            {' '}of{' '}
            <span className="font-medium text-stone-900">
              {table.getPageCount()}
            </span>
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              'p-1.5 rounded border border-stone-200 hover:bg-stone-50 transition-colors',
              !table.getCanNextPage() && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )}
            title="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className={cn(
              'p-1.5 rounded border border-stone-200 hover:bg-stone-50 transition-colors',
              !table.getCanNextPage() && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )}
            title="Last page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
