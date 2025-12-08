'use client'

import { GPURanking } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber, formatVRAM } from '@/lib/utils'
import Link from 'next/link'

interface GPUCardProps {
  gpu: GPURanking
}

export function GPUCard({ gpu }: GPUCardProps) {
  const vendorColors: Record<string, string> = {
    NVIDIA: 'bg-green-50 text-green-700 border-green-200',
    AMD: 'bg-red-50 text-red-700 border-red-200',
    Apple: 'bg-stone-100 text-stone-700 border-stone-200',
    Intel: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <Link href={`/gpu/${encodeURIComponent(gpu.name)}`}>
      <div className="card card-hover p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={cn('rank-badge', getRankBadgeClass(gpu.rank))}>
              {gpu.rank}
            </span>
            <div>
              <h3 className="font-semibold">{gpu.name}</h3>
              <span
                className={cn(
                  'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded border',
                  vendorColors[gpu.vendor] || 'bg-stone-50 text-stone-600 border-stone-200'
                )}
              >
                {gpu.vendor}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">{formatNumber(gpu.avg_tokens_per_second, 1)}</div>
            <div className="text-xs text-[var(--muted)]">tok/s avg</div>
          </div>
        </div>

        <div className="flex justify-between text-sm pt-3 border-t border-[var(--border)]">
          <div>
            <span className="text-[var(--muted)]">VRAM:</span>{' '}
            <span className="font-mono">{formatVRAM(gpu.vram_mb)}</span>
          </div>
          <div>
            <span className="text-[var(--muted)]">Benchmarks:</span>{' '}
            <span className="font-mono">{gpu.submission_count}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
