'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchModelRankings } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber } from '@/lib/utils'
import Link from 'next/link'

export default function ModelsPage() {
  const [vendor, setVendor] = useState<string | null>(null)

  const { data: models, isLoading } = useQuery({
    queryKey: ['models', vendor],
    queryFn: () => fetchModelRankings({ vendor: vendor || undefined, limit: 50 }),
  })

  const vendorColors: Record<string, string> = {
    Meta: 'bg-blue-50 text-blue-700',
    Mistral: 'bg-orange-50 text-orange-700',
    Google: 'bg-green-50 text-green-700',
    Microsoft: 'bg-cyan-50 text-cyan-700',
    Qwen: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Model Rankings</h1>
          <p className="text-stone-500">
            Compare average inference performance across different models
          </p>
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
        ) : models && models.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Vendor</th>
                <th className="px-6 py-4 font-medium">Parameters</th>
                <th className="px-6 py-4 font-medium">Benchmarks</th>
                <th className="px-6 py-4 font-medium">Avg tok/s</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr
                  key={model.name}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className={cn('rank-badge', getRankBadgeClass(model.rank))}>
                      {model.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/model/${encodeURIComponent(model.name)}`}
                      className="font-medium text-stone-900 hover:text-orange-600 transition-colors"
                    >
                      {model.display_name || model.name.split('/').pop()}
                    </Link>
                    <div className="text-xs text-stone-400 font-mono mt-1 truncate max-w-[300px]">
                      {model.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded',
                        vendorColors[model.vendor] || 'bg-stone-100 text-stone-700'
                      )}
                    >
                      {model.vendor}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-stone-700">
                    {model.parameters_b}B
                  </td>
                  <td className="px-6 py-4 text-stone-600">
                    {model.submission_count}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-stone-900">
                    {formatNumber(model.avg_tokens_per_second, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">No Models Found</h3>
            <p className="text-stone-500">
              No model benchmarks have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
