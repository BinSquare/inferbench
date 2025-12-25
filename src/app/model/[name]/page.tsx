'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { fetchModelDetail, ModelDetail } from '@/lib/api'
import { cn, formatNumber, formatVRAM, timeAgo } from '@/lib/utils'
import { DataTable, DataTableColumnHeader } from '@/components/ui'
import Link from 'next/link'

type ModelSubmission = NonNullable<ModelDetail['all_submissions']>[number]

export default function ModelDetailPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)

  const { data: model, isLoading } = useQuery({
    queryKey: ['model', name],
    queryFn: () => fetchModelDetail(name),
  })

  const columns: ColumnDef<ModelSubmission>[] = useMemo(
    () => [
      {
        accessorKey: 'gpu_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="GPU" />
        ),
        cell: ({ row }) =>
          row.original.gpu_name ? (
            <Link
              href={`/gpu/${encodeURIComponent(row.original.gpu_name)}`}
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              {row.original.gpu_name}
            </Link>
          ) : (
            <span className="text-stone-400">CPU Only</span>
          ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'cpu_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CPU" />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm text-stone-600 max-w-[150px] truncate block"
            title={row.original.cpu_name}
          >
            {row.original.cpu_name}
          </span>
        ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'quantization',
        header: 'Quantization',
        cell: ({ row }) =>
          row.original.quantization ? (
            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
              {row.original.quantization}
            </span>
          ) : (
            <span className="text-stone-400">-</span>
          ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'backend',
        header: 'Backend',
        cell: ({ row }) => (
          <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-600">
            {row.original.backend}
          </span>
        ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'context_length',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Context" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-stone-600">
            {row.original.context_length || '-'}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'total_vram_mb',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="VRAM Used" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-stone-600">
            {row.original.total_vram_mb ? formatVRAM(row.original.total_vram_mb) : '-'}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'tokens_per_second',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tokens/sec" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-stone-900">
            {formatNumber(row.original.tokens_per_second, 1)}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'prefill_tokens_per_second',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Prefill" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-stone-600">
            {row.original.prefill_tokens_per_second
              ? formatNumber(row.original.prefill_tokens_per_second, 0)
              : '-'}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-stone-500">
            {timeAgo(row.original.created_at)}
          </span>
        ),
        enableColumnFilter: false,
      },
    ],
    []
  )

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

  if (!model || (model as any).error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Model Not Found</h3>
          <p className="text-stone-500 mb-4">
            No benchmark data found for this model.
          </p>
          <Link
            href="/models"
            className="text-orange-600 hover:text-orange-500"
          >
            ← Back to Model Rankings
          </Link>
        </div>
      </div>
    )
  }

  const vendorColors: Record<string, string> = {
    Meta: 'text-blue-600',
    Mistral: 'text-orange-600',
    Google: 'text-green-600',
    Microsoft: 'text-cyan-600',
    Qwen: 'text-purple-600',
  }

  const submissions = model.all_submissions || []
  const tokensPerSecondValues = submissions.map((s) => s.tokens_per_second)
  const minTps = tokensPerSecondValues.length > 0 ? Math.min(...tokensPerSecondValues) : 0
  const maxTps = tokensPerSecondValues.length > 0 ? Math.max(...tokensPerSecondValues) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/models"
          className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block"
        >
          ← Back to Model Rankings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              {model.display_name || model.name.split('/').pop()}
            </h1>
            <div className="flex items-center gap-4 text-stone-500">
              <span className={cn('font-medium', vendorColors[model.vendor] || 'text-stone-600')}>
                {model.vendor}
              </span>
              <span>•</span>
              <span>{model.parameters_b}B parameters</span>
              {model.context_length && (
                <>
                  <span>•</span>
                  <span>{model.context_length.toLocaleString()} context</span>
                </>
              )}
              <span>•</span>
              <span>{model.submission_count} benchmarks</span>
            </div>
            <div className="text-xs text-stone-400 font-mono mt-2">
              {model.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-stone-500 mb-1">Rank</div>
            <div className="text-4xl font-bold font-mono text-stone-900">#{model.rank}</div>
            <div className="text-sm text-stone-500">
              Top {model.percentile}%
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
            {formatNumber(model.avg_tokens_per_second, 1)}
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
            {model.submission_count}
          </div>
        </div>
      </div>

      {/* HuggingFace Link */}
      {model.huggingface_url && (
        <div className="mb-8">
          <a
            href={model.huggingface_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition-colors"
          >
            View on HuggingFace →
          </a>
        </div>
      )}

      {/* All Submissions */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-stone-900">All Benchmark Data</h2>
        <p className="text-sm text-stone-500 mt-1">
          Hardware performance results for this model ({submissions.length} submissions)
        </p>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        enableGlobalFilter={true}
        filterableColumns={['backend', 'quantization']}
        defaultSorting={[{ id: 'tokens_per_second', desc: true }]}
        emptyIcon="📊"
        emptyTitle="No Benchmarks"
        emptyDescription="No benchmarks submitted yet for this model."
      />
    </div>
  )
}
