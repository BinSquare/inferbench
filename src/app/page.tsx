'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchLeaderboard, fetchStats, fetchModels, fetchBackends, fetchVendors } from '@/lib/api'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { FilterDropdown } from '@/components/FilterDropdown'

export default function Home() {
  const [filters, setFilters] = useState({
    model: null as string | null,
    backend: null as string | null,
    gpu_vendor: null as string | null,
    sort_by: 'tokens_per_second',
    page: 1,
  })

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: () => fetchLeaderboard({
      model: filters.model || undefined,
      backend: filters.backend || undefined,
      sort: filters.sort_by as 'tokens_per_second' | 'created_at' | 'value',
    }),
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })

  const { data: models } = useQuery({
    queryKey: ['filter-models'],
    queryFn: fetchModels,
  })

  const { data: backends } = useQuery({
    queryKey: ['backends'],
    queryFn: fetchBackends,
  })

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Inference Hardware Leaderboard</h1>
            <p className="text-sm text-stone-500 mt-1">
              Community-driven benchmark database for local LLM inference.
              <a
                href="https://github.com/BinSquare/inferbench"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 ml-2"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Submissions:</span>
              <span className="font-semibold text-stone-900">{stats?.total_submissions ?? '-'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">GPUs:</span>
              <span className="font-semibold text-stone-900">{stats?.total_gpus ?? '-'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">CPUs:</span>
              <span className="font-semibold text-stone-900">{stats?.total_cpus ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            label="Model"
            value={filters.model}
            options={models?.filter((m) => m.model).map((m) => ({ label: m.model.split('/').pop() || m.model, value: m.model })) || []}
            onChange={(model) => setFilters((f) => ({ ...f, model, page: 1 }))}
          />
          <FilterDropdown
            label="Backend"
            value={filters.backend}
            options={backends?.filter((b) => b.backend).map((b) => ({ label: b.backend, value: b.backend })) || []}
            onChange={(backend) => setFilters((f) => ({ ...f, backend, page: 1 }))}
          />
          <FilterDropdown
            label="GPU Vendor"
            value={filters.gpu_vendor}
            options={vendors?.filter((v) => v.vendor).map((v) => ({ label: v.vendor, value: v.vendor })) || []}
            onChange={(gpu_vendor) => setFilters((f) => ({ ...f, gpu_vendor, page: 1 }))}
          />
          <FilterDropdown
            label="Sort"
            value={filters.sort_by}
            options={[
              { label: 'Fastest (tok/s)', value: 'tokens_per_second' },
              { label: 'Best Value', value: 'value' },
              { label: 'Most Recent', value: 'created_at' },
            ]}
            onChange={(sort_by) => setFilters((f) => ({ ...f, sort_by: sort_by || 'tokens_per_second', page: 1 }))}
            placeholder="Default"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable entries={leaderboard || []} isLoading={isLoading} />
    </div>
  )
}
