'use client'

import { useState } from 'react'
import { LeaderboardEntry } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber, timeAgo } from '@/lib/utils'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading?: boolean
}

function formatVram(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  }
  return `${mb} MB`
}

function formatPrice(usd: number): string {
  return `$${usd.toLocaleString()}`
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
              <div className="w-8 h-8 bg-stone-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-3 bg-stone-100 rounded w-1/4" />
              </div>
              <div className="w-24 h-6 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-stone-900 mb-2">No Results Yet</h3>
        <p className="text-stone-500">
          Be the first to submit a benchmark result!
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
            <th className="px-6 py-4 font-medium">Rank</th>
            <th className="px-6 py-4 font-medium">Hardware</th>
            <th className="px-6 py-4 font-medium">Model</th>
            <th className="px-6 py-4 font-medium">Backend</th>
            <th className="px-6 py-4 font-medium">Tokens/sec</th>
            <th className="px-6 py-4 font-medium">tok/s/$</th>
            <th className="px-6 py-4 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.submission_id
            return (
              <>
                <tr
                  key={entry.submission_id}
                  className={cn(
                    "border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer",
                    isExpanded && "bg-stone-50"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : entry.submission_id)}
                >
                  <td className="px-6 py-4">
                    <span className={cn('rank-badge', getRankBadgeClass(entry.rank))}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900">{entry.gpu_name || 'CPU Only'}</div>
                    <div className="text-sm text-stone-500">{entry.cpu_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-orange-600">
                      {entry.model.split('/').pop()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-600">
                      {entry.backend}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-stone-900">
                    {formatNumber(entry.tokens_per_second, 1)}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-stone-600">
                    {entry.value_score != null ? formatNumber(entry.value_score, 3) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {timeAgo(entry.created_at)}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${entry.submission_id}-details`} className="bg-stone-50 border-b border-stone-200">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* GPU Details */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                            GPU Setup
                          </h4>
                          {entry.gpus.length > 0 ? (
                            <div className="space-y-2">
                              {entry.gpus.map((gpu, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="font-medium text-stone-900">
                                    {gpu.quantity > 1 ? `${gpu.quantity}x ` : ''}{gpu.name}
                                  </div>
                                  <div className="text-stone-500">
                                    {gpu.vendor} · {formatVram(gpu.vram_mb)}
                                    {gpu.interconnect && ` · ${gpu.interconnect}`}
                                  </div>
                                </div>
                              ))}
                              <div className="text-sm text-stone-500 pt-1 border-t border-stone-200">
                                Total: {entry.total_gpu_count} GPU{entry.total_gpu_count !== 1 ? 's' : ''} · {formatVram(entry.total_vram_mb)} VRAM
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-stone-500">CPU Only</div>
                          )}
                        </div>

                        {/* Model & Performance */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                            Benchmark
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-stone-500">Model: </span>
                              <span className="font-mono text-orange-600">{entry.model}</span>
                            </div>
                            {entry.model_parameters_b && (
                              <div>
                                <span className="text-stone-500">Parameters: </span>
                                <span className="text-stone-900">{entry.model_parameters_b}B</span>
                              </div>
                            )}
                            {entry.quantization && (
                              <div>
                                <span className="text-stone-500">Quantization: </span>
                                <span className="text-stone-900">{entry.quantization}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-stone-500">Backend: </span>
                              <span className="text-stone-900">{entry.backend}</span>
                            </div>
                            <div className="pt-2 border-t border-stone-200">
                              <span className="text-stone-500">Speed: </span>
                              <span className="font-mono font-semibold text-stone-900">
                                {formatNumber(entry.tokens_per_second, 2)} tok/s
                              </span>
                            </div>
                            <div className="text-stone-400 text-xs">
                              Submitted {timeAgo(entry.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                            System Cost (MSRP)
                          </h4>
                          <div className="space-y-1 text-sm">
                            {entry.is_unified_soc ? (
                              // Unified SoC (Apple Silicon, AMD Ryzen AI Max)
                              <>
                                {entry.gpu_msrp_usd != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">SoC:</span>
                                    <span className="text-stone-900">{formatPrice(entry.gpu_msrp_usd)}</span>
                                  </div>
                                )}
                                <div className="text-xs text-stone-400 italic">
                                  Includes CPU, GPU & unified memory
                                </div>
                              </>
                            ) : (
                              // Discrete GPU + CPU system
                              <>
                                {entry.gpu_msrp_usd != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">GPU:</span>
                                    <span className="text-stone-900">{formatPrice(entry.gpu_msrp_usd)}</span>
                                  </div>
                                )}
                                {entry.cpu_msrp_usd != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">CPU:</span>
                                    <span className="text-stone-900">{formatPrice(entry.cpu_msrp_usd)}</span>
                                  </div>
                                )}
                                {entry.ram_cost_usd > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">RAM ({formatVram(entry.ram_mb)}):</span>
                                    <span className="text-stone-900">~{formatPrice(entry.ram_cost_usd)}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {entry.total_system_cost_usd != null && (
                              <div className="flex justify-between pt-1 border-t border-stone-200 font-medium">
                                <span className="text-stone-700">Total:</span>
                                <span className="text-stone-900">{formatPrice(entry.total_system_cost_usd)}</span>
                              </div>
                            )}
                            {entry.value_score != null && (
                              <div className="flex justify-between pt-2">
                                <span className="text-stone-500">Value:</span>
                                <span className="font-mono text-stone-900">
                                  {formatNumber(entry.value_score, 3)} tok/s/$
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
