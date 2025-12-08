'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { fetchGPUDetail } from '@/lib/api'
import { cn, formatNumber, formatVRAM, timeAgo } from '@/lib/utils'
import Link from 'next/link'

export default function GPUDetailPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)

  const { data: gpu, isLoading } = useQuery({
    queryKey: ['gpu', name],
    queryFn: () => fetchGPUDetail(name),
  })

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-stone-200 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-stone-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-stone-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!gpu || (gpu as any).error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">GPU Not Found</h3>
          <p className="text-stone-500 mb-4">
            No benchmark data found for this GPU.
          </p>
          <Link
            href="/gpus"
            className="text-orange-600 hover:text-orange-500"
          >
            ← Back to GPU Rankings
          </Link>
        </div>
      </div>
    )
  }

  const vendorColors: Record<string, string> = {
    NVIDIA: 'text-green-600',
    AMD: 'text-red-600',
    Apple: 'text-stone-600',
    Intel: 'text-blue-600',
  }

  // Calculate stats from submissions
  const submissions = gpu.all_submissions || []
  const tokensPerSecondValues = submissions.map((s: any) => s.tokens_per_second)
  const minTps = tokensPerSecondValues.length > 0 ? Math.min(...tokensPerSecondValues) : 0
  const maxTps = tokensPerSecondValues.length > 0 ? Math.max(...tokensPerSecondValues) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/gpus"
          className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block"
        >
          ← Back to GPU Rankings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">{gpu.name}</h1>
            <div className="flex items-center gap-4 text-stone-500">
              <span className={cn('font-medium', vendorColors[gpu.vendor])}>
                {gpu.vendor}
              </span>
              <span>•</span>
              <span>{formatVRAM(gpu.vram_mb)} VRAM</span>
              {gpu.architecture && (
                <>
                  <span>•</span>
                  <span>{gpu.architecture}</span>
                </>
              )}
              <span>•</span>
              <span>{gpu.submission_count} benchmarks</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-stone-500 mb-1">Rank</div>
            <div className="text-4xl font-bold font-mono text-stone-900">#{gpu.rank}</div>
            <div className="text-sm text-stone-500">
              Top {gpu.percentile}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-sm text-stone-500 uppercase tracking-wide mb-2">
            Avg Tokens/sec
          </div>
          <div className="text-3xl font-bold font-mono text-stone-900">
            {formatNumber(gpu.avg_tokens_per_second, 1)}
          </div>
        </div>

        <div className="card p-6">
          <div className="text-sm text-stone-500 uppercase tracking-wide mb-2">
            Best Result
          </div>
          <div className="text-3xl font-bold font-mono text-green-600">
            {formatNumber(maxTps, 1)}
          </div>
        </div>

        <div className="card p-6">
          <div className="text-sm text-stone-500 uppercase tracking-wide mb-2">
            Lowest Result
          </div>
          <div className="text-3xl font-bold font-mono text-stone-500">
            {formatNumber(minTps, 1)}
          </div>
        </div>

        <div className="card p-6">
          <div className="text-sm text-stone-500 uppercase tracking-wide mb-2">
            Total Benchmarks
          </div>
          <div className="text-3xl font-bold font-mono text-stone-900">
            {gpu.submission_count}
          </div>
        </div>
      </div>

      {/* All Submissions - Supporting Data */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">All Benchmark Data</h2>
          <p className="text-sm text-stone-500 mt-1">
            Complete data used to calculate the average ranking ({submissions.length} submissions)
          </p>
        </div>
        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                  <th className="px-6 py-3 font-medium">Model</th>
                  <th className="px-6 py-3 font-medium">Params</th>
                  <th className="px-6 py-3 font-medium">Quantization</th>
                  <th className="px-6 py-3 font-medium">Backend</th>
                  <th className="px-6 py-3 font-medium">CPU</th>
                  <th className="px-6 py-3 font-medium">Context</th>
                  <th className="px-6 py-3 font-medium">Tokens/sec</th>
                  <th className="px-6 py-3 font-medium">Prefill</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub: any) => (
                  <tr
                    key={sub.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-orange-600">
                        {sub.model.split('/').pop()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {sub.model_parameters_b ? `${sub.model_parameters_b}B` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.quantization ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
                          {sub.quantization}
                        </span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-600">
                        {sub.backend}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 max-w-[150px] truncate" title={sub.cpu_name}>
                      {sub.cpu_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {sub.context_length || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-stone-900">
                      {formatNumber(sub.tokens_per_second, 1)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-stone-600">
                      {sub.prefill_tokens_per_second ? formatNumber(sub.prefill_tokens_per_second, 0) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {timeAgo(sub.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-500">
            No benchmarks submitted yet
          </div>
        )}
      </div>
    </div>
  )
}
