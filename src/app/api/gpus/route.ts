import { db, submissions, submissionGpus } from '@/db'
import { sql, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'
import { parsePaginationParams } from '@/lib/validation'

// Name aliases to match submissions to GPU_LIST
const GPU_NAME_ALIASES: Record<string, string> = {
  'NVIDIA H100 PCIe 80GB': 'NVIDIA H100 PCIe',
  'NVIDIA A100 PCIe 80GB': 'NVIDIA A100 80GB',
  'NVIDIA GeForce RTX 4090': 'NVIDIA RTX 4090',
  'NVIDIA GeForce RTX 4080': 'NVIDIA RTX 4080',
  'NVIDIA GeForce RTX 4070 Ti': 'NVIDIA RTX 4070 Ti',
  'NVIDIA GeForce RTX 3090': 'NVIDIA RTX 3090',
  'NVIDIA GeForce RTX 3080 Ti': 'NVIDIA RTX 3080 Ti',
  'NVIDIA GeForce RTX 3080': 'NVIDIA RTX 3080',
  'NVIDIA GeForce RTX 3070': 'NVIDIA RTX 3070',
}

// Create lookup maps from hardware data
const gpuPriceMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.msrp_usd]))
const gpuVendorMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.vendor]))
const gpuVramMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.vram_mb]))

// Helper to lookup GPU info with alias support
function lookupGpu(name: string) {
  const aliasedName = GPU_NAME_ALIASES[name] || name
  return {
    msrp: gpuPriceMap.get(aliasedName) || gpuPriceMap.get(name),
    vendor: gpuVendorMap.get(aliasedName) || gpuVendorMap.get(name),
    vram: gpuVramMap.get(aliasedName) || gpuVramMap.get(name),
  }
}

// Valid sort options
const VALID_SORT_OPTIONS = ['performance', 'value'] as const
type SortOption = typeof VALID_SORT_OPTIONS[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const vendor = searchParams.get('vendor')
    const sortParam = searchParams.get('sort')
    const sortBy: SortOption = sortParam && VALID_SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : 'performance'
    const { limit, offset } = parsePaginationParams(searchParams)

    // Compute GPU stats directly from submissions table
    // This ensures we always have accurate, up-to-date data
    const gpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)
      .groupBy(submissions.primaryGpuName)

    // Build entries with all GPU info
    let entries = gpuStats.map((stat) => {
      const gpuName = stat.gpuName!
      const gpuInfo = lookupGpu(gpuName)
      const avgTps = Number(stat.avgTokensPerSecond) || 0

      // Infer vendor from name if not in lookup
      let vendor: string = gpuInfo.vendor || ''
      if (!vendor) {
        if (gpuName.startsWith('NVIDIA')) vendor = 'NVIDIA'
        else if (gpuName.startsWith('AMD')) vendor = 'AMD'
        else if (gpuName.startsWith('Apple')) vendor = 'Apple'
        else if (gpuName.startsWith('Intel')) vendor = 'Intel'
        else vendor = 'Other'
      }

      // Value score = tok/s per $1000 spent
      const valueScore = gpuInfo.msrp && gpuInfo.msrp > 0 && avgTps > 0
        ? (avgTps / gpuInfo.msrp) * 1000
        : null

      return {
        name: gpuName,
        vendor,
        vram_mb: gpuInfo.vram || 0,
        submission_count: stat.submissionCount,
        avg_tokens_per_second: Math.round(avgTps * 100) / 100,
        msrp_usd: gpuInfo.msrp || null,
        value_score: valueScore ? Math.round(valueScore * 10) / 10 : null,
      }
    })

    // Filter by vendor if specified
    if (vendor) {
      entries = entries.filter(e => e.vendor === vendor)
    }

    const totalGpus = entries.length || 1

    // Sort based on sortBy parameter
    if (sortBy === 'value') {
      // Sort by value score descending (best value first), nulls last
      entries.sort((a, b) => {
        if (a.value_score === null && b.value_score === null) return 0
        if (a.value_score === null) return 1
        if (b.value_score === null) return -1
        return b.value_score - a.value_score
      })
    } else {
      // Sort by performance (avg tokens per second) descending
      entries.sort((a, b) => b.avg_tokens_per_second - a.avg_tokens_per_second)
    }

    // Apply pagination and add ranks
    entries = entries.slice(offset, offset + limit).map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
      percentile: Math.round(((totalGpus - (offset + index + 1)) / totalGpus) * 100),
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
