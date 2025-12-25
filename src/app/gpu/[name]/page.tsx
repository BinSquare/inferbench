'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { fetchGPUDetail, GPUDetail } from '@/lib/api'
import { cn, formatNumber, formatVRAM, timeAgo } from '@/lib/utils'
import { DataTable, DataTableColumnHeader } from '@/components/ui'
import Link from 'next/link'

type GPUSubmission = NonNullable<GPUDetail['all_submissions']>[number]

export default function GPUDetailPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)

  const { data: gpu, isLoading } = useQuery({
    queryKey: ['gpu', name],
    queryFn: () => fetchGPUDetail(name),
  })

  const columns: ColumnDef<GPUSubmission>[] = useMemo(
    () => [
      {
        accessorKey: 'model',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Model" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-orange-600">
            {row.original.model.split('/').pop()}
          </span>
        ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'model_parameters_b',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Params" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-stone-600">
            {row.original.model_parameters_b ? `${row.original.model_parameters_b}B` : '-'}
          </span>
        ),
        enableColumnFilter: false,
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

  const submissions = gpu.all_submissions || []
  const tokensPerSecondValues = submissions.map((s) => s.tokens_per_second)
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

      {/* All Submissions */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-stone-900">All Benchmark Data</h2>
        <p className="text-sm text-stone-500 mt-1">
          Complete data used to calculate the average ranking ({submissions.length} submissions)
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
        emptyDescription="No benchmarks submitted yet for this GPU."
      />
    </div>
  )
}
