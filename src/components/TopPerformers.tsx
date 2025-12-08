'use client'

import { cn, formatNumber } from '@/lib/utils'

interface TopPerformer {
  gpu: string
  tokens_per_second: number
}

interface TopPerformersProps {
  performers: TopPerformer[]
}

export function TopPerformers({ performers }: TopPerformersProps) {
  if (performers.length === 0) return null

  const medals = ['1', '2', '3']
  const medalColors = ['bg-orange-500 text-white', 'bg-stone-400 text-white', 'bg-amber-600 text-white']

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-4">
        Top Performers
      </h3>
      <div className="space-y-4">
        {performers.slice(0, 3).map((performer, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', medalColors[index])}>
              {medals[index]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-stone-900 truncate">{performer.gpu}</div>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {formatNumber(performer.tokens_per_second, 1)}
              <span className="text-sm font-normal text-stone-500 ml-1">tok/s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
