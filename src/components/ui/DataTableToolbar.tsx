'use client'

import { Table } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { DataTableFilter } from './DataTableFilter'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  enableGlobalFilter?: boolean
  globalFilter: string
  setGlobalFilter: (value: string) => void
  filterableColumns?: string[]
  toolbarExtra?: ReactNode
}

export function DataTableToolbar<TData>({
  table,
  enableGlobalFilter = true,
  globalFilter,
  setGlobalFilter,
  filterableColumns = [],
  toolbarExtra,
}: DataTableToolbarProps<TData>) {
  // Get active filter count
  const activeFilters = table.getState().columnFilters.length

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        {/* Global search */}
        {enableGlobalFilter && (
          <div className="relative max-w-sm flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Column filters */}
        {filterableColumns.map((columnId) => {
          const column = table.getColumn(columnId)
          if (!column) return null

          // Get the header name from the column definition
          const headerDef = column.columnDef.header
          const title = typeof headerDef === 'string'
            ? headerDef
            : columnId.charAt(0).toUpperCase() + columnId.slice(1)

          return (
            <DataTableFilter
              key={columnId}
              column={column}
              title={title}
            />
          )
        })}

        {/* Clear filters button */}
        {activeFilters > 0 && (
          <button
            onClick={() => table.resetColumnFilters()}
            className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      {/* Extra toolbar content */}
      {toolbarExtra && (
        <div className="flex items-center gap-3">
          {toolbarExtra}
        </div>
      )}
    </div>
  )
}
