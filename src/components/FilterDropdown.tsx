'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FilterDropdownProps {
  label: string
  value: string | null
  options: Array<{ label: string; value: string }>
  onChange: (value: string | null) => void
  placeholder?: string
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'All',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded border border-stone-200 bg-white text-sm',
          'hover:bg-stone-50 transition-colors',
          value && 'border-orange-300 bg-orange-50'
        )}
      >
        <span className="text-stone-500">{label}:</span>
        <span className={cn(value ? 'text-stone-900' : 'text-stone-500')}>
          {selectedOption?.label || placeholder}
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
        <div className="absolute top-full left-0 mt-1 min-w-full w-max z-50 bg-white border border-stone-200 rounded-md shadow-lg py-1 max-h-64 overflow-auto">
          <button
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className={cn(
              'w-full text-left px-4 py-2 text-sm hover:bg-stone-50',
              !value && 'text-orange-600'
            )}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-stone-50',
                value === option.value && 'text-orange-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
