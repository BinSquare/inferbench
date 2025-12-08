'use client'

import { cn, getScoreBarClass, getScoreColor } from '@/lib/utils'

interface ScoreBarProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBar({ score, showLabel = true, size = 'md' }: ScoreBarProps) {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex-1 bg-stone-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getScoreBarClass(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-mono font-bold text-sm min-w-[3ch]', getScoreColor(score))}>
          {score}
        </span>
      )}
    </div>
  )
}
