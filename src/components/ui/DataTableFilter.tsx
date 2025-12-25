'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Column } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DataTableFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableFilter<TData, TValue>({
  column,
  title,
}: DataTableFilterProps<TData, TValue>) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selectedValue = column.getFilterValue() as string | undefined

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get unique values with counts from faceted values
  const facetedValues = column.getFacetedUniqueValues()
  const sortedUniqueValues = useMemo(() => {
    const values: Array<{ value: string; count: number }> = []
    facetedValues.forEach((count, value) => {
      if (value != null && value !== '') {
        values.push({ value: String(value), count })
      }
    })
    return values
      .filter((item) =>
        item.value.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.count - a.count)
  }, [facetedValues, search])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded border border-stone-200 bg-white text-sm',
          'hover:bg-stone-50 transition-colors',
          selectedValue && 'border-orange-300 bg-orange-50'
        )}
      >
        <span className="text-stone-500">{title}:</span>
        <span className={cn(selectedValue ? 'text-stone-900' : 'text-stone-500')}>
          {selectedValue || 'All'}
        </span>
        <svg
          className={cn('w-4 h-4 text-stone-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] w-max z-50 bg-white border border-stone-200 rounded-md shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-stone-100">
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-auto py-1">
            <button
              onClick={() => {
                column.setFilterValue(undefined)
                setIsOpen(false)
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-stone-50 flex items-center justify-between',
                !selectedValue && 'text-orange-600'
              )}
            >
              <span>All</span>
            </button>
            {sortedUniqueValues.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  column.setFilterValue(item.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm hover:bg-stone-50 flex items-center justify-between',
                  selectedValue === item.value && 'text-orange-600'
                )}
              >
                <span className="truncate">{item.value}</span>
                <span className="text-stone-400 text-xs ml-2">({item.count})</span>
              </button>
            ))}
            {sortedUniqueValues.length === 0 && search && (
              <div className="px-4 py-2 text-sm text-stone-400">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
