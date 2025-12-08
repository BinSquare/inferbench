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
    queryKey: ['models'],
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
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Inference Hardware Leaderboard</h1>
        <p className="text-stone-500">
          All results are user-submitted and checked by unpaid volunteers. Help us improve this data by submitting and flagging suspicious submissions!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <FilterDropdown
              label="Model"
              value={filters.model}
              options={models?.map((m) => ({ label: m.model.split('/').pop() || m.model, value: m.model })) || []}
              onChange={(model) => setFilters((f) => ({ ...f, model, page: 1 }))}
            />
            <FilterDropdown
              label="Backend"
              value={filters.backend}
              options={backends?.map((b) => ({ label: b.backend, value: b.backend })) || []}
              onChange={(backend) => setFilters((f) => ({ ...f, backend, page: 1 }))}
            />
            <FilterDropdown
              label="GPU Vendor"
              value={filters.gpu_vendor}
              options={vendors?.map((v) => ({ label: v.vendor, value: v.vendor })) || []}
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

          {/* Leaderboard Table */}
          <LeaderboardTable entries={leaderboard || []} isLoading={isLoading} />

          {/* Pagination - TODO: implement when API supports total count */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-4">
              Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Total Submissions</span>
                <span className="font-medium text-stone-900">{stats?.total_submissions ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">GPUs Tested</span>
                <span className="font-medium text-stone-900">{stats?.total_gpus ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">CPUs Tested</span>
                <span className="font-medium text-stone-900">{stats?.total_cpus ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-4">
              About
            </h3>
            <p className="text-sm text-stone-500">
              InferBench is a open and free enchmark database for LLM inference hardware.
              All results are manually submitted by users and validated by volunteer users like yourself.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
