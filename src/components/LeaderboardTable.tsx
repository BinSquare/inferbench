'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LeaderboardEntry } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber, timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading?: boolean
}

async function voteOnSubmission(id: string, type: 'validate' | 'question', reason?: string) {
  const res = await fetch(`/api/submissions/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, reason }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to vote')
  }
  return res.json()
}

function QuestionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      setError('Please provide at least 10 characters explaining why this seems questionable')
      return
    }
    setError('')
    onSubmit(reason)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">Flag as Questionable</h3>
        <p className="text-sm text-stone-500 mb-4">
          Please explain why this benchmark result seems incorrect or suspicious.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., The tok/s is unusually high for this GPU..."
          className="w-full h-24 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || reason.trim().length < 10}
            className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatVram(mb: number | null): string {
  if (mb === null) return 'N/A'
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
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [questionModalId, setQuestionModalId] = useState<string | null>(null)
  const [localCounts, setLocalCounts] = useState<Record<string, { validation: number; question: number }>>({})
  const queryClient = useQueryClient()

  const voteMutation = useMutation({
    mutationFn: ({ id, type, reason }: { id: string; type: 'validate' | 'question'; reason?: string }) =>
      voteOnSubmission(id, type, reason),
    onSuccess: (data, variables) => {
      setVotedIds(prev => new Set(prev).add(variables.id))
      setQuestionModalId(null)
      setLocalCounts(prev => ({
        ...prev,
        [variables.id]: {
          validation: data.validation_count,
          question: data.question_count,
        },
      }))
      // Invalidate leaderboard query to refresh data
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const handleValidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (votedIds.has(id)) return
    voteMutation.mutate({ id, type: 'validate' })
  }

  const handleQuestionClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (votedIds.has(id)) return
    setQuestionModalId(id)
  }

  const handleQuestionSubmit = (reason: string) => {
    if (!questionModalId) return
    voteMutation.mutate({ id: questionModalId, type: 'question', reason })
  }

  const getValidationCount = (entry: LeaderboardEntry) =>
    localCounts[entry.submission_id]?.validation ?? entry.validation_count

  const getQuestionCount = (entry: LeaderboardEntry) =>
    localCounts[entry.submission_id]?.question ?? entry.question_count

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
                    <div className="flex items-center gap-2">
                      <span>{timeAgo(entry.created_at)}</span>
                      {entry.verified ? (
                        <span className="text-green-500" title="Verified">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : entry.question_count > 0 ? (
                        <span className="text-amber-500" title={`${entry.question_count} flag(s)`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
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
                            {entry.context_length && (
                              <div>
                                <span className="text-stone-500">Context Length: </span>
                                <span className="text-stone-900">{entry.context_length.toLocaleString()}</span>
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
                            {/* Verification Status & Feedback */}
                            <div className="pt-2 border-t border-stone-200 mt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {entry.verified ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      Unverified
                                    </span>
                                  )}
                                </div>
                                {/* Feedback Buttons */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleValidate(entry.submission_id, e)}
                                    disabled={votedIds.has(entry.submission_id) || voteMutation.isPending}
                                    className={cn(
                                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                      votedIds.has(entry.submission_id)
                                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                    )}
                                    title="This result looks accurate"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                    </svg>
                                    <span>Validate ({getValidationCount(entry)})</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleQuestionClick(entry.submission_id, e)}
                                    disabled={votedIds.has(entry.submission_id) || voteMutation.isPending}
                                    className={cn(
                                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                      votedIds.has(entry.submission_id)
                                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    )}
                                    title="Flag as questionable"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    <span>Flag ({getQuestionCount(entry)})</span>
                                  </button>
                                  <Link
                                    href="/submissions"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-stone-500 hover:text-orange-600 underline ml-2"
                                  >
                                    View all submissions
                                  </Link>
                                </div>
                              </div>
                            </div>
                            {entry.source_url && (
                              <div className="pt-2">
                                <a
                                  href={entry.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>View source</span>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* GPU/SoC Cost & Value */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                            {entry.is_unified_soc ? 'SoC Cost (MSRP)' : 'GPU Cost (MSRP)'}
                          </h4>
                          <div className="space-y-1 text-sm">
                            {entry.gpu_msrp_usd != null ? (
                              <>
                                <div className="flex justify-between font-medium">
                                  <span className="text-stone-700">{entry.is_unified_soc ? 'SoC:' : 'GPU:'}</span>
                                  <span className="text-stone-900">{formatPrice(entry.gpu_msrp_usd)}</span>
                                </div>
                                {entry.is_unified_soc && (
                                  <div className="text-xs text-stone-400 italic">
                                    Includes CPU, GPU & unified memory
                                  </div>
                                )}
                                {entry.value_score != null && (
                                  <div className="flex justify-between pt-2 border-t border-stone-200">
                                    <span className="text-stone-500">Value:</span>
                                    <span className="font-mono text-stone-900">
                                      {formatNumber(entry.value_score, 3)} tok/s/$
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-stone-400 italic">Price not available</div>
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

      {/* Question Modal */}
      <QuestionModal
        isOpen={questionModalId !== null}
        onClose={() => setQuestionModalId(null)}
        onSubmit={handleQuestionSubmit}
        isLoading={voteMutation.isPending}
      />
    </div>
  )
}
