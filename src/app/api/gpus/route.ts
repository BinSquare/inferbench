import { db, gpus } from '@/db'
import { desc, eq, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'
import { parsePaginationParams, safeParseInt } from '@/lib/validation'

// Create a price lookup map from hardware data
const gpuPriceMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.msrp_usd]))

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

    // Fetch all GPUs first (we need to calculate value scores before sorting)
    let data
    if (vendor) {
      data = await db
        .select()
        .from(gpus)
        .where(eq(gpus.vendor, vendor))
    } else {
      data = await db
        .select()
        .from(gpus)
    }

    // Get total count for percentile calculation
    const [countResult] = await db
      .select({ count: count() })
      .from(gpus)

    const totalGpus = Number(countResult?.count) || data.length || 1

    // Calculate value score and add to entries
    let entries = data.map((gpu) => {
      const msrp = gpuPriceMap.get(gpu.name)
      // Value score = tok/s per $1000 spent
      const valueScore = msrp && msrp > 0 && gpu.avgTokensPerSecond > 0
        ? (gpu.avgTokensPerSecond / msrp) * 1000
        : null

      return {
        id: gpu.id,
        name: gpu.name,
        vendor: gpu.vendor,
        vram_mb: gpu.vramMb,
        submission_count: gpu.submissionCount,
        avg_tokens_per_second: gpu.avgTokensPerSecond,
        msrp_usd: msrp || null,
        value_score: valueScore ? Math.round(valueScore * 10) / 10 : null,
      }
    })

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
