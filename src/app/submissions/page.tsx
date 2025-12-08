'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { cn, formatNumber, timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface Submission {
  id: string
  primary_gpu_name: string | null
  cpu_name: string
  model: string
  backend: string
  quantization: string | null
  tokens_per_second: number
  created_at: string
  validation_count: number
  question_count: number
  source_url: string | null
}

async function fetchLatestSubmissions(): Promise<Submission[]> {
  const res = await fetch('/api/submissions/latest')
  if (!res.ok) throw new Error('Failed to fetch submissions')
  return res.json()
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

function getSourceIcon(url: string): string {
  if (url.includes('reddit.com')) return 'Reddit'
  if (url.includes('github.com')) return 'GitHub'
  if (url.includes('huggingface.co')) return 'HF'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'X'
  return 'Link'
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
          This helps reviewers investigate the issue.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., The tok/s is unusually high for this GPU, Numbers don't match my own testing, Seems like a typo..."
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

export default function SubmissionsPage() {
  const queryClient = useQueryClient()
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [questionModalId, setQuestionModalId] = useState<string | null>(null)

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', 'latest'],
    queryFn: fetchLatestSubmissions,
  })

  const voteMutation = useMutation({
    mutationFn: ({ id, type, reason }: { id: string; type: 'validate' | 'question'; reason?: string }) =>
      voteOnSubmission(id, type, reason),
    onSuccess: (data, variables) => {
      setVotedIds(prev => new Set(prev).add(variables.id))
      setQuestionModalId(null)
      queryClient.setQueryData(['submissions', 'latest'], (old: Submission[] | undefined) => {
        if (!old) return old
        return old.map(sub =>
          sub.id === variables.id
            ? {
                ...sub,
                validation_count: data.validation_count,
                question_count: data.question_count,
              }
            : sub
        )
      })
    },
  })

  const handleValidate = (id: string) => {
    if (votedIds.has(id)) return
    voteMutation.mutate({ id, type: 'validate' })
  }

  const handleQuestionClick = (id: string) => {
    if (votedIds.has(id)) return
    setQuestionModalId(id)
  }

  const handleQuestionSubmit = (reason: string) => {
    if (!questionModalId) return
    voteMutation.mutate({ id: questionModalId, type: 'question', reason })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Latest Submissions</h1>
        <p className="text-stone-500">
          User-submitted benchmark results. Help the community by validating results or flagging questionable data.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-6 text-sm text-stone-500">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span>Looks accurate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-600">?</span>
          <span>Seems questionable</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone-100">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
                <div className="w-24 h-6 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        ) : submissions && submissions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
                <th className="px-6 py-4 font-medium">Hardware</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Backend</th>
                <th className="px-6 py-4 font-medium">Tokens/sec</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium text-center">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const hasVoted = votedIds.has(sub.id)
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sub.primary_gpu_name ? (
                          <Link
                            href={`/gpu/${encodeURIComponent(sub.primary_gpu_name)}`}
                            className="font-medium text-stone-900 hover:text-orange-600 transition-colors block"
                          >
                            {sub.primary_gpu_name}
                          </Link>
                        ) : (
                          <span className="font-medium text-stone-900">CPU Only</span>
                        )}
                        <div className="text-xs text-stone-500">{sub.cpu_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-orange-600">
                        {sub.model.split('/').pop()}
                      </span>
                      {sub.quantization && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700">
                          {sub.quantization}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-600">
                        {sub.backend}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-stone-900">
                      {formatNumber(sub.tokens_per_second, 1)}
                    </td>
                    <td className="px-6 py-4">
                      {sub.source_url ? (
                        <a
                          href={sub.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          {getSourceIcon(sub.source_url)}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {timeAgo(sub.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleValidate(sub.id)}
                          disabled={hasVoted || voteMutation.isPending}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                            hasVoted
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          )}
                          title="This result looks accurate"
                        >
                          <span>✓</span>
                          <span>{sub.validation_count}</span>
                        </button>
                        <button
                          onClick={() => handleQuestionClick(sub.id)}
                          disabled={hasVoted || voteMutation.isPending}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                            hasVoted
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          )}
                          title="This result seems questionable"
                        >
                          <span>?</span>
                          <span>{sub.question_count}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">No Submissions Yet</h3>
            <p className="text-stone-500">
              Be the first to submit a benchmark result!
            </p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
        <h3 className="text-sm font-semibold text-stone-700 mb-2">About Community Validation</h3>
        <p className="text-sm text-stone-500">
          All benchmark results are user-submitted and unverified. Help improve data quality by marking results
          that match your experience as accurate (✓) or flagging results that seem off (?). When flagging,
          please explain why so reviewers can investigate. Results with sources link to the original post.
        </p>
      </div>

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
