'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { fetchGPURankings, compareGPUs, fetchGPUDetail, GPUDetail } from '@/lib/api'
import { cn, formatNumber, formatVRAM } from '@/lib/utils'

export default function ComparePage() {
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const { data: allGPUs } = useQuery({
    queryKey: ['gpus', 'all'],
    queryFn: () => fetchGPURankings({ limit: 100 }),
  })

  const { data: comparison } = useQuery({
    queryKey: ['compare', selectedGPUs],
    queryFn: () => compareGPUs(selectedGPUs),
    enabled: selectedGPUs.length >= 2,
  })

  // Fetch detailed submissions for each GPU to find common models
  const gpuDetailQueries = useQueries({
    queries: selectedGPUs.map((gpuName) => ({
      queryKey: ['gpu-detail', gpuName],
      queryFn: () => fetchGPUDetail(gpuName),
      enabled: selectedGPUs.length >= 2,
    })),
  })

  // Find common models and compute per-model performance
  const perModelComparison = useMemo(() => {
    if (selectedGPUs.length < 2) return null

    const gpuDetails = gpuDetailQueries
      .map((q) => q.data)
      .filter((d): d is GPUDetail => !!d && !('error' in d) && !!d.all_submissions)

    if (gpuDetails.length !== selectedGPUs.length) return null

    // Build a map of model -> GPU -> avg tokens/s
    const modelPerformance = new Map<string, Map<string, { total: number; count: number }>>()

    for (const gpuDetail of gpuDetails) {
      for (const submission of gpuDetail.all_submissions) {
        if (!submission.model) continue

        if (!modelPerformance.has(submission.model)) {
          modelPerformance.set(submission.model, new Map())
        }

        const gpuMap = modelPerformance.get(submission.model)!
        const existing = gpuMap.get(gpuDetail.name) || { total: 0, count: 0 }
        gpuMap.set(gpuDetail.name, {
          total: existing.total + submission.tokens_per_second,
          count: existing.count + 1,
        })
      }
    }

    // Filter to only models that all selected GPUs have benchmarked
    const commonModels: Array<{
      model: string
      displayName: string
      performances: Map<string, number>
      maxTps: number
    }> = []

    Array.from(modelPerformance.entries()).forEach(([model, gpuMap]) => {
      // Check if all selected GPUs have this model
      if (gpuMap.size === selectedGPUs.length) {
        const performances = new Map<string, number>()
        let maxTps = 0

        Array.from(gpuMap.entries()).forEach(([gpuName, stats]) => {
          const avgTps = stats.total / stats.count
          performances.set(gpuName, avgTps)
          maxTps = Math.max(maxTps, avgTps)
        })

        commonModels.push({
          model,
          displayName: model.split('/').pop()?.replace(/-/g, ' ') || model,
          performances,
          maxTps,
        })
      }
    })

    // Sort by model name
    commonModels.sort((a, b) => a.displayName.localeCompare(b.displayName))

    return commonModels
  }, [selectedGPUs, gpuDetailQueries])

  const filteredGPUs = allGPUs?.filter(
    (gpu) =>
      gpu.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedGPUs.includes(gpu.name)
  )

  const toggleGPU = (name: string) => {
    if (selectedGPUs.includes(name)) {
      setSelectedGPUs(selectedGPUs.filter((g) => g !== name))
    } else if (selectedGPUs.length < 4) {
      setSelectedGPUs([...selectedGPUs, name])
    }
  }

  const maxTps = comparison?.comparisons
    ? Math.max(...comparison.comparisons.map((c: any) => c.avg_tokens_per_second))
    : 100

  const barColors = [
    'bg-orange-500',
    'bg-amber-500',
    'bg-stone-400',
    'bg-stone-300',
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Compare GPUs</h1>
        <p className="text-stone-500">
          Select up to 4 GPUs to compare their inference performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GPU Selection */}
        <div className="space-y-4">
          <div className="card p-4">
            <input
              type="text"
              placeholder="Search GPUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Selected GPUs */}
          {selectedGPUs.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-stone-500 mb-3">
                Selected ({selectedGPUs.length}/4)
              </h3>
              <div className="space-y-2">
                {selectedGPUs.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-3 py-2 bg-orange-50 border border-orange-200 rounded-md"
                  >
                    <span className="text-sm font-medium text-stone-900 truncate">{name}</span>
                    <button
                      onClick={() => toggleGPU(name)}
                      className="text-orange-500 hover:text-orange-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available GPUs */}
          <div className="card p-4 max-h-96 overflow-auto">
            <h3 className="text-sm font-semibold text-stone-500 mb-3">
              Available GPUs
            </h3>
            <div className="space-y-1">
              {filteredGPUs?.map((gpu) => (
                <button
                  key={gpu.name}
                  onClick={() => toggleGPU(gpu.name)}
                  disabled={selectedGPUs.length >= 4}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed',
                    selectedGPUs.includes(gpu.name) && 'bg-orange-50'
                  )}
                >
                  <div className="font-medium text-stone-900">{gpu.name}</div>
                  <div className="text-xs text-stone-500">
                    {gpu.vendor} • {formatVRAM(gpu.vram_mb)} • {formatNumber(gpu.avg_tokens_per_second, 1)} tok/s
                  </div>
                </button>
              ))}
              {filteredGPUs?.length === 0 && (
                <p className="text-sm text-stone-500 py-4 text-center">
                  No GPUs match your search
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        <div className="lg:col-span-2">
          {selectedGPUs.length < 2 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Select GPUs to Compare</h3>
              <p className="text-stone-500">
                Choose at least 2 GPUs from the list to see a comparison
              </p>
            </div>
          ) : comparison?.comparisons ? (
            <div className="space-y-6">
              {/* Tokens/sec Comparison */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-6">
                  Tokens per Second (Average)
                </h3>
                <div className="space-y-4">
                  {comparison.comparisons.map((gpu: any, index: number) => (
                    <div key={gpu.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-stone-900">{gpu.name}</span>
                        <span className="font-mono text-stone-700">
                          {formatNumber(gpu.avg_tokens_per_second, 1)} tok/s
                        </span>
                      </div>
                      <div className="h-8 bg-stone-100 rounded-lg overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-lg transition-all duration-500',
                            barColors[index] || 'bg-stone-300'
                          )}
                          style={{ width: `${(gpu.avg_tokens_per_second / maxTps) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs Comparison */}
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                      <th className="px-6 py-4 font-medium">Spec</th>
                      {comparison.comparisons.map((gpu: any) => (
                        <th key={gpu.name} className="px-6 py-4 font-medium">
                          {gpu.name.split(' ').slice(-2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">Vendor</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 text-stone-900">{gpu.vendor}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">VRAM</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono text-stone-900">
                          {formatVRAM(gpu.vram_mb)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">Benchmarks</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono text-stone-900">
                          {gpu.submission_count}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">Avg tok/s</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td
                          key={gpu.name}
                          className="px-6 py-4 font-mono font-bold text-stone-900"
                        >
                          {formatNumber(gpu.avg_tokens_per_second, 1)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      <td className="px-6 py-4 text-stone-500 font-medium" colSpan={comparison.comparisons.length + 1}>
                        Pricing
                      </td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">MSRP</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono text-stone-900">
                          {gpu.msrp_usd ? `$${gpu.msrp_usd.toLocaleString()}` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">Used Price</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono text-stone-900">
                          {gpu.used_price_usd ? `$${gpu.used_price_usd.toLocaleString()}` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-6 py-4 text-stone-500">MSRP Value</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono text-stone-600">
                          {gpu.value_score ? `${formatNumber(gpu.value_score, 3)} tok/s/$` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-stone-500">Used Value</td>
                      {comparison.comparisons.map((gpu: any) => (
                        <td key={gpu.name} className="px-6 py-4 font-mono font-semibold text-green-600">
                          {gpu.used_value_score ? `${formatNumber(gpu.used_value_score, 3)} tok/s/$` : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Per-Model Performance Comparison */}
              {perModelComparison && perModelComparison.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-6">
                    Performance by Model ({perModelComparison.length} common model{perModelComparison.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-6">
                    {perModelComparison.map((modelData) => (
                      <div key={modelData.model}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-stone-900 text-sm">{modelData.displayName}</span>
                          <span className="text-xs text-stone-400 font-mono truncate ml-2 max-w-[200px]">
                            {modelData.model}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedGPUs.map((gpuName, index) => {
                            const tps = modelData.performances.get(gpuName) || 0
                            return (
                              <div key={gpuName} className="flex items-center gap-3">
                                <span className="text-xs text-stone-500 w-32 truncate" title={gpuName}>
                                  {gpuName.split(' ').slice(-2).join(' ')}
                                </span>
                                <div className="flex-1 h-5 bg-stone-100 rounded overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded transition-all duration-500',
                                      barColors[index] || 'bg-stone-300'
                                    )}
                                    style={{ width: `${(tps / modelData.maxTps) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs text-stone-700 w-20 text-right">
                                  {formatNumber(tps, 1)} tok/s
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No common models message */}
              {perModelComparison && perModelComparison.length === 0 && (
                <div className="card p-6 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">No Common Models</h3>
                  <p className="text-sm text-stone-500">
                    These GPUs don't have benchmark data for the same models yet.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
