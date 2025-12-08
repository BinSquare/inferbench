'use client'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatsCard({ label, value, subtext, trend, className }: StatsCardProps) {
  return (
    <div className={cn('card p-6', className)}>
      <div className="stat-label mb-2">{label}</div>
      <div className="stat-value flex items-baseline gap-2">
        {value}
        {trend && (
          <span
            className={cn('text-sm', {
              'text-emerald-400': trend === 'up',
              'text-red-400': trend === 'down',
              'text-gray-400': trend === 'neutral',
            })}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
          </span>
        )}
      </div>
      {subtext && <div className="text-sm text-[var(--muted)] mt-1">{subtext}</div>}
    </div>
  )
}
