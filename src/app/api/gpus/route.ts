import { db, submissions, submissionGpus } from '@/db'
import { sql, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'
import { parsePaginationParams } from '@/lib/validation'

// Name aliases to match submissions to GPU_LIST (variant -> canonical)
// Handles common naming variations like "GeForce RTX" vs "RTX"
const GPU_NAME_ALIASES: Record<string, string> = {
  // Data center / Professional
  'NVIDIA H100 PCIe 80GB': 'NVIDIA H100 PCIe',
  'NVIDIA A100 PCIe 80GB': 'NVIDIA A100 80GB',

  // AMD - Radeon vs non-Radeon naming
  'AMD Radeon RX 7900 XTX': 'AMD RX 7900 XTX',
  'AMD Radeon RX 7900 XT': 'AMD RX 7900 XT',
  'AMD Radeon RX 7900 GRE': 'AMD RX 7900 GRE',
  'AMD Radeon RX 7800 XT': 'AMD RX 7800 XT',
  'AMD Radeon RX 7700 XT': 'AMD RX 7700 XT',
  'AMD Radeon RX 7600 XT': 'AMD RX 7600 XT',
  'AMD Radeon RX 7600': 'AMD RX 7600',
  'AMD Radeon RX 6950 XT': 'AMD RX 6950 XT',
  'AMD Radeon RX 6900 XT': 'AMD RX 6900 XT',
  'AMD Radeon RX 6800 XT': 'AMD RX 6800 XT',
  'AMD Radeon RX 6800': 'AMD RX 6800',
  'AMD Radeon RX 6700 XT': 'AMD RX 6700 XT',

  // RTX 50 Series (Blackwell)
  'NVIDIA GeForce RTX 5090': 'NVIDIA RTX 5090',
  'NVIDIA GeForce RTX 5080': 'NVIDIA RTX 5080',
  'NVIDIA GeForce RTX 5070 Ti': 'NVIDIA RTX 5070 Ti',
  'NVIDIA GeForce RTX 5070': 'NVIDIA RTX 5070',

  // RTX 40 Series
  'NVIDIA GeForce RTX 4090': 'NVIDIA RTX 4090',
  'NVIDIA GeForce RTX 4080 SUPER': 'NVIDIA RTX 4080 SUPER',
  'NVIDIA GeForce RTX 4080': 'NVIDIA RTX 4080',
  'NVIDIA GeForce RTX 4070 Ti SUPER': 'NVIDIA RTX 4070 Ti SUPER',
  'NVIDIA GeForce RTX 4070 Ti': 'NVIDIA RTX 4070 Ti',
  'NVIDIA GeForce RTX 4070 SUPER': 'NVIDIA RTX 4070 SUPER',
  'NVIDIA GeForce RTX 4070': 'NVIDIA RTX 4070',
  'NVIDIA GeForce RTX 4060 Ti 16GB': 'NVIDIA RTX 4060 Ti 16GB',
  'NVIDIA GeForce RTX 4060 Ti 8GB': 'NVIDIA RTX 4060 Ti 8GB',
  'NVIDIA GeForce RTX 4060 Ti': 'NVIDIA RTX 4060 Ti 8GB',
  'NVIDIA GeForce RTX 4060': 'NVIDIA RTX 4060',

  // RTX 30 Series
  'NVIDIA GeForce RTX 3090 Ti': 'NVIDIA RTX 3090 Ti',
  'NVIDIA GeForce RTX 3090': 'NVIDIA RTX 3090',
  'NVIDIA GeForce RTX 3080 Ti': 'NVIDIA RTX 3080 Ti',
  'NVIDIA GeForce RTX 3080 12GB': 'NVIDIA RTX 3080 12GB',
  'NVIDIA GeForce RTX 3080 10GB': 'NVIDIA RTX 3080 10GB',
  'NVIDIA GeForce RTX 3080': 'NVIDIA RTX 3080 10GB',
  'NVIDIA GeForce RTX 3070 Ti': 'NVIDIA RTX 3070 Ti',
  'NVIDIA GeForce RTX 3070': 'NVIDIA RTX 3070',
  'NVIDIA GeForce RTX 3060 Ti': 'NVIDIA RTX 3060 Ti',
  'NVIDIA GeForce RTX 3060 12GB': 'NVIDIA RTX 3060 12GB',
  'NVIDIA GeForce RTX 3060': 'NVIDIA RTX 3060 12GB',
}

// Get canonical name for any GPU name (applies alias if exists)
function getCanonicalName(name: string): string {
  return GPU_NAME_ALIASES[name] || name
}

// Create lookup maps from hardware data
const gpuPriceMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.msrp_usd]))
const gpuUsedPriceMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.used_price_usd]))
const gpuVendorMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.vendor]))
const gpuVramMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.vram_mb]))

// Helper to lookup GPU info with alias support
function lookupGpu(name: string) {
  const aliasedName = GPU_NAME_ALIASES[name] || name
  return {
    msrp: gpuPriceMap.get(aliasedName) || gpuPriceMap.get(name),
    usedPrice: gpuUsedPriceMap.get(aliasedName) || gpuUsedPriceMap.get(name),
    vendor: gpuVendorMap.get(aliasedName) || gpuVendorMap.get(name),
    vram: gpuVramMap.get(aliasedName) || gpuVramMap.get(name),
  }
}

// Valid sort options
const VALID_SORT_OPTIONS = ['performance', 'value', 'used_value'] as const
type SortOption = typeof VALID_SORT_OPTIONS[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const vendor = searchParams.get('vendor')
    const model = searchParams.get('model')
    const sortParam = searchParams.get('sort')
    const sortBy: SortOption = sortParam && VALID_SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : 'performance'
    const { limit, offset } = parsePaginationParams(searchParams)

    // Build where conditions
    const whereConditions = [sql`${submissions.primaryGpuName} IS NOT NULL`]
    if (model) {
      whereConditions.push(sql`${submissions.model} = ${model}`)
    }

    // Compute GPU stats directly from submissions table
    // This ensures we always have accurate, up-to-date data
    const gpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
        totalTokensPerSecond: sql<number>`sum(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(sql.join(whereConditions, sql` AND `))
      .groupBy(submissions.primaryGpuName)

    // Merge entries with aliased names into their canonical name
    const mergedStats = new Map<string, {
      submissionCount: number
      totalTokensPerSecond: number
    }>()

    for (const stat of gpuStats) {
      const rawName = stat.gpuName!
      const canonicalName = getCanonicalName(rawName)
      const existing = mergedStats.get(canonicalName)

      if (existing) {
        existing.submissionCount += stat.submissionCount
        existing.totalTokensPerSecond += Number(stat.totalTokensPerSecond) || 0
      } else {
        mergedStats.set(canonicalName, {
          submissionCount: stat.submissionCount,
          totalTokensPerSecond: Number(stat.totalTokensPerSecond) || 0,
        })
      }
    }

    // Build entries with all GPU info from merged stats
    let entries = Array.from(mergedStats.entries()).map(([gpuName, stats]) => {
      const gpuInfo = lookupGpu(gpuName)
      const avgTps = stats.submissionCount > 0
        ? stats.totalTokensPerSecond / stats.submissionCount
        : 0

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

      // Used value score = tok/s per $1000 at used price
      const usedValueScore = gpuInfo.usedPrice && gpuInfo.usedPrice > 0 && avgTps > 0
        ? (avgTps / gpuInfo.usedPrice) * 1000
        : null

      return {
        name: gpuName,
        vendor,
        vram_mb: gpuInfo.vram || 0,
        submission_count: stats.submissionCount,
        avg_tokens_per_second: Math.round(avgTps * 100) / 100,
        msrp_usd: gpuInfo.msrp || null,
        used_price_usd: gpuInfo.usedPrice || null,
        value_score: valueScore ? Math.round(valueScore * 10) / 10 : null,
        used_value_score: usedValueScore ? Math.round(usedValueScore * 10) / 10 : null,
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
    } else if (sortBy === 'used_value') {
      // Sort by used value score descending (best used value first), nulls last
      entries.sort((a, b) => {
        if (a.used_value_score === null && b.used_value_score === null) return 0
        if (a.used_value_score === null) return 1
        if (b.used_value_score === null) return -1
        return b.used_value_score - a.used_value_score
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

    // Return with caching headers - GPU stats don't change frequently
    return NextResponse.json(entries, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
