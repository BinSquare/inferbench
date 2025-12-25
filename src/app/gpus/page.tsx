'use client'

import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { fetchGPURankings, fetchModels, GPURanking } from '@/lib/api'
import { cn, getRankBadgeClass, formatNumber, formatVRAM } from '@/lib/utils'
import { DataTable, DataTableColumnHeader } from '@/components/ui'
import { FilterDropdown } from '@/components/FilterDropdown'
import Link from 'next/link'

export default function GPUsPage() {
  const [modelFilter, setModelFilter] = useState<string | null>(null)

  const { data: gpus, isLoading } = useQuery({
    queryKey: ['gpus', modelFilter],
    queryFn: () => fetchGPURankings({ limit: 100, model: modelFilter || undefined }),
  })

  const { data: models } = useQuery({
    queryKey: ['filter-models'],
    queryFn: fetchModels,
  })

  const columns: ColumnDef<GPURanking>[] = useMemo(
    () => [
      {
        id: 'rank',
        header: '#',
        cell: ({ row, table }) => {
          const sortedRows = table.getRowModel().rows
          const visualIndex = sortedRows.findIndex(r => r.id === row.id) + 1
          return (
            <span className={cn('rank-badge', getRankBadgeClass(visualIndex))}>
              {visualIndex}
            </span>
          )
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="GPU" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/gpu/${encodeURIComponent(row.original.name)}`}
            className="font-medium text-stone-900 hover:text-orange-600 transition-colors"
          >
            {row.original.name}
          </Link>
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
              row.original.vendor === 'NVIDIA' && 'bg-green-50 text-green-700',
              row.original.vendor === 'AMD' && 'bg-red-50 text-red-700',
              row.original.vendor === 'Apple' && 'bg-stone-100 text-stone-700',
              row.original.vendor === 'Intel' && 'bg-blue-50 text-blue-700'
            )}
          >
            {row.original.vendor}
          </span>
        ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'vram_mb',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="VRAM" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-stone-700">
            {formatVRAM(row.original.vram_mb)}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'msrp_usd',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="MSRP" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-stone-600">
            {row.original.msrp_usd ? `$${row.original.msrp_usd.toLocaleString()}` : '-'}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'used_price_usd',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Used Price" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-stone-600">
            {row.original.used_price_usd ? `$${row.original.used_price_usd.toLocaleString()}` : '-'}
          </span>
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
      {
        accessorKey: 'value_score',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="MSRP Value" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-stone-600">
            {row.original.value_score ? (
              <>
                {formatNumber(row.original.value_score, 3)}
                <span className="text-xs text-stone-400 ml-1">tok/s/$</span>
              </>
            ) : (
              '-'
            )}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'used_value_score',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Used Value" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-green-600">
            {row.original.used_value_score ? (
              <>
                {formatNumber(row.original.used_value_score, 3)}
                <span className="text-xs text-stone-400 ml-1">tok/s/$</span>
              </>
            ) : (
              '-'
            )}
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
        <h1 className="text-2xl font-bold text-stone-900 mb-2">GPU Rankings</h1>
        <p className="text-stone-500">
          Compare average inference performance across different GPUs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <FilterDropdown
          label="Model"
          value={modelFilter}
          options={models?.filter((m) => m.model).map((m) => ({
            label: m.model.split('/').pop() || m.model,
            value: m.model
          })) || []}
          onChange={setModelFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={gpus || []}
        isLoading={isLoading}
        enableGlobalFilter={true}
        filterableColumns={['vendor']}
        defaultSorting={[{ id: 'avg_tokens_per_second', desc: true }]}
        emptyIcon="🎮"
        emptyTitle="No GPUs Found"
        emptyDescription="No GPU benchmarks have been submitted yet."
      />
    </div>
  )
}
