import { db, submissions } from '@/db'
import { inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'

const MAX_GPU_NAME_LENGTH = 200

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

// Build reverse alias map (canonical -> all variants including itself)
const REVERSE_ALIASES: Record<string, string[]> = {}
for (const [variant, canonical] of Object.entries(GPU_NAME_ALIASES)) {
  if (!REVERSE_ALIASES[canonical]) {
    REVERSE_ALIASES[canonical] = [canonical]
  }
  REVERSE_ALIASES[canonical].push(variant)
}

// Get canonical name for any GPU name (applies alias if exists)
function getCanonicalName(name: string): string {
  return GPU_NAME_ALIASES[name] || name
}

// Get all name variants for a GPU (canonical + aliases)
function getAllNameVariants(name: string): string[] {
  const canonical = getCanonicalName(name)
  return REVERSE_ALIASES[canonical] || [canonical]
}

const gpuDataMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu]))

function lookupGpuData(name: string) {
  const aliasedName = GPU_NAME_ALIASES[name] || name
  return gpuDataMap.get(aliasedName) || gpuDataMap.get(name)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const names = searchParams.getAll('names')

    if (names.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 GPU names are required' },
        { status: 400 }
      )
    }

    if (names.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 GPUs can be compared at once' },
        { status: 400 }
      )
    }

    // Validate name lengths to prevent abuse
    const invalidNames = names.filter(n => !n || n.length > MAX_GPU_NAME_LENGTH)
    if (invalidNames.length > 0) {
      return NextResponse.json(
        { error: 'Invalid GPU name provided' },
        { status: 400 }
      )
    }

    // Get canonical names and all variants for each requested GPU
    const canonicalNames = Array.from(new Set(names.map(getCanonicalName)))
    const allVariants = canonicalNames.flatMap(getAllNameVariants)

    // Get stats for all name variants from submissions
    const gpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        submissionCount: sql<number>`count(*)::int`,
        totalTokensPerSecond: sql<number>`sum(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(inArray(submissions.primaryGpuName, allVariants))
      .groupBy(submissions.primaryGpuName)

    // Merge aliased GPUs
    const mergedStats = new Map<string, { count: number; totalTps: number }>()
    for (const stat of gpuStats) {
      const canonical = getCanonicalName(stat.gpuName!)
      const existing = mergedStats.get(canonical)
      if (existing) {
        existing.count += stat.submissionCount
        existing.totalTps += Number(stat.totalTokensPerSecond) || 0
      } else {
        mergedStats.set(canonical, {
          count: stat.submissionCount,
          totalTps: Number(stat.totalTokensPerSecond) || 0,
        })
      }
    }

    // Get all GPUs for total count (also merge aliases for accurate count)
    const allGpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
      })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)
      .groupBy(submissions.primaryGpuName)

    const uniqueCanonicalGpus = new Set(allGpuStats.map(s => getCanonicalName(s.gpuName!)))
    const totalGpus = uniqueCanonicalGpus.size || mergedStats.size || 1

    // Build comparisons with GPU data from merged stats
    const comparisons = Array.from(mergedStats.entries())
      .map(([gpuName, stats]) => {
        const gpuData = lookupGpuData(gpuName)
        const avgTps = stats.count > 0 ? stats.totalTps / stats.count : 0

        // Infer vendor from name if not in lookup
        let vendor: string = gpuData?.vendor || ''
        if (!vendor) {
          if (gpuName.startsWith('NVIDIA')) vendor = 'NVIDIA'
          else if (gpuName.startsWith('AMD')) vendor = 'AMD'
          else if (gpuName.startsWith('Apple')) vendor = 'Apple'
          else if (gpuName.startsWith('Intel')) vendor = 'Intel'
          else vendor = 'Other'
        }

        const msrpUsd = gpuData?.msrp_usd || null
        const usedPriceUsd = gpuData?.used_price_usd || null

        // Value score = tok/s per $1000 spent
        const valueScore = msrpUsd && msrpUsd > 0 && avgTps > 0
          ? Math.round((avgTps / msrpUsd) * 1000 * 10) / 10
          : null

        // Used value score = tok/s per $1000 at used price
        const usedValueScore = usedPriceUsd && usedPriceUsd > 0 && avgTps > 0
          ? Math.round((avgTps / usedPriceUsd) * 1000 * 10) / 10
          : null

        return {
          name: gpuName,
          vendor,
          vram_mb: gpuData?.vram_mb || 0,
          submission_count: stats.count,
          avg_tokens_per_second: Math.round(avgTps * 100) / 100,
          msrp_usd: msrpUsd,
          used_price_usd: usedPriceUsd,
          value_score: valueScore,
          used_value_score: usedValueScore,
        }
      })
      .sort((a, b) => b.avg_tokens_per_second - a.avg_tokens_per_second)
      .map((gpu, index) => ({
        ...gpu,
        rank: index + 1,
        percentile: Math.round(((totalGpus - (index + 1)) / totalGpus) * 100),
      }))

    return NextResponse.json({ comparisons })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
