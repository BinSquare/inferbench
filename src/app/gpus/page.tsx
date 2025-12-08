'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchGPURankings, fetchVendors } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber, formatVRAM } from '@/lib/utils'
import { FilterDropdown } from '@/components/FilterDropdown'
import Link from 'next/link'

export default function GPUsPage() {
  const [vendor, setVendor] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'performance' | 'value'>('performance')

  const { data: gpus, isLoading } = useQuery({
    queryKey: ['gpus', vendor, sortBy],
    queryFn: () => fetchGPURankings({ vendor: vendor || undefined, sort: sortBy, limit: 50 }),
  })

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">GPU Rankings</h1>
          <p className="text-stone-500">
            Compare average inference performance across different GPUs
          </p>
        </div>
        <div className="flex gap-3">
          <FilterDropdown
            label="Sort"
            value={sortBy}
            options={[
              { label: 'Performance (tok/s)', value: 'performance' },
              { label: 'Best Value (tok/s per $)', value: 'value' },
            ]}
            onChange={(val) => setSortBy((val as 'performance' | 'value') || 'performance')}
            placeholder="Performance"
          />
          <FilterDropdown
            label="Vendor"
            value={vendor}
            options={vendors?.map((v) => ({ label: v.vendor, value: v.vendor })) || []}
            onChange={setVendor}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
                <div className="w-8 h-8 bg-stone-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-3 bg-stone-100 rounded w-1/4" />
                </div>
                <div className="w-32 h-6 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        ) : gpus && gpus.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">GPU</th>
                <th className="px-6 py-4 font-medium">Vendor</th>
                <th className="px-6 py-4 font-medium">VRAM</th>
                {sortBy === 'value' && <th className="px-6 py-4 font-medium">MSRP</th>}
                <th className="px-6 py-4 font-medium">Avg tok/s</th>
                {sortBy === 'value' && <th className="px-6 py-4 font-medium">Value</th>}
              </tr>
            </thead>
            <tbody>
              {gpus.map((gpu) => (
                <tr
                  key={gpu.name}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className={cn('rank-badge', getRankBadgeClass(gpu.rank))}>
                      {gpu.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/gpu/${encodeURIComponent(gpu.name)}`}
                      className="font-medium text-stone-900 hover:text-orange-600 transition-colors"
                    >
                      {gpu.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded',
                        gpu.vendor === 'NVIDIA' && 'bg-green-50 text-green-700',
                        gpu.vendor === 'AMD' && 'bg-red-50 text-red-700',
                        gpu.vendor === 'Apple' && 'bg-stone-100 text-stone-700',
                        gpu.vendor === 'Intel' && 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {gpu.vendor}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-stone-700">
                    {formatVRAM(gpu.vram_mb)}
                  </td>
                  {sortBy === 'value' && (
                    <td className="px-6 py-4 font-mono text-stone-600">
                      {gpu.msrp_usd ? `$${gpu.msrp_usd.toLocaleString()}` : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 font-mono font-semibold text-stone-900">
                    {formatNumber(gpu.avg_tokens_per_second, 1)}
                  </td>
                  {sortBy === 'value' && (
                    <td className="px-6 py-4 font-mono font-semibold text-green-600">
                      {gpu.value_score ? `${formatNumber(gpu.value_score, 1)}` : '-'}
                      {gpu.value_score && <span className="text-xs text-stone-400 ml-1">tok/s/$k</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">No GPUs Found</h3>
            <p className="text-stone-500">
              No GPU benchmarks have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
