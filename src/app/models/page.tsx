'use client'

import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { fetchModelRankings, ModelRanking } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber } from '@/lib/utils'
import { DataTable, DataTableColumnHeader } from '@/components/ui'
import Link from 'next/link'

const vendorColors: Record<string, string> = {
  Meta: 'bg-blue-50 text-blue-700',
  Mistral: 'bg-orange-50 text-orange-700',
  Google: 'bg-green-50 text-green-700',
  Microsoft: 'bg-cyan-50 text-cyan-700',
  Qwen: 'bg-purple-50 text-purple-700',
}

export default function ModelsPage() {
  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => fetchModelRankings({ limit: 100 }),
  })

  const columns: ColumnDef<ModelRanking>[] = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: 'Rank',
        cell: ({ row }) => (
          <span className={cn('rank-badge', getRankBadgeClass(row.original.rank))}>
            {row.original.rank}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Model" />
        ),
        cell: ({ row }) => (
          <div>
            <Link
              href={`/model/${encodeURIComponent(row.original.name || '')}`}
              className="font-medium text-stone-900 hover:text-orange-600 transition-colors"
            >
              {row.original.display_name || row.original.name?.split('/').pop() || 'Unknown'}
            </Link>
            <div className="text-xs text-stone-400 font-mono mt-1 truncate max-w-[300px]">
              {row.original.name || '-'}
            </div>
          </div>
        ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'vendor',
        header: 'Vendor',
        cell: ({ row }) => (
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded',
              vendorColors[row.original.vendor] || 'bg-stone-100 text-stone-700'
            )}
          >
            {row.original.vendor}
          </span>
        ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'parameters_b',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Parameters" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-stone-700">
            {row.original.parameters_b != null ? `${row.original.parameters_b}B` : '-'}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        id: 'quantization',
        header: 'Quant',
        cell: () => (
          <span className="text-sm text-stone-400">Mixed</span>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'submission_count',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Benchmarks" />
        ),
        cell: ({ row }) => (
          <span className="text-stone-600">{row.original.submission_count}</span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'avg_tokens_per_second',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Avg tok/s" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-stone-900">
            {formatNumber(row.original.avg_tokens_per_second, 1)}
          </span>
        ),
        enableColumnFilter: false,
      },
    ],
    []
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Model Rankings</h1>
        <p className="text-stone-500">
          Compare average inference performance across different models
        </p>
      </div>

      <DataTable
        columns={columns}
        data={models || []}
        isLoading={isLoading}
        enableGlobalFilter={true}
        filterableColumns={['vendor']}
        defaultSorting={[{ id: 'avg_tokens_per_second', desc: true }]}
        emptyIcon="🤖"
        emptyTitle="No Models Found"
        emptyDescription="No model benchmarks have been submitted yet."
      />
    </div>
  )
}
