import { db, submissions } from '@/db'
import { desc, eq, sql, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'

const MAX_NAME_LENGTH = 200
const MAX_SUBMISSIONS_PER_DETAIL = 500

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    // Validate name length
    if (!name || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Invalid GPU name' }, { status: 400 })
    }

    const decodedName = decodeURIComponent(name)
    const canonicalName = getCanonicalName(decodedName)
    const nameVariants = getAllNameVariants(decodedName)

    // Get GPU stats from submissions (including all name variants/aliases)
    const [gpuStats] = await db
      .select({
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(inArray(submissions.primaryGpuName, nameVariants))

    if (!gpuStats || gpuStats.submissionCount === 0) {
      return NextResponse.json({ error: 'GPU not found' }, { status: 404 })
    }

    // Get GPU spec data from hardware-data.ts
    const gpuData = lookupGpuData(canonicalName)

    // Infer vendor from name if not in lookup
    let vendor: string = gpuData?.vendor || ''
    if (!vendor) {
      if (canonicalName.startsWith('NVIDIA')) vendor = 'NVIDIA'
      else if (canonicalName.startsWith('AMD')) vendor = 'AMD'
      else if (canonicalName.startsWith('Apple')) vendor = 'Apple'
      else if (canonicalName.startsWith('Intel')) vendor = 'Intel'
      else vendor = 'Other'
    }

    // Get all GPU rankings to compute rank/percentile
    // First get raw stats, then merge aliases
    const rawGpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        totalTps: sql<number>`sum(${submissions.tokensPerSecond})`,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)
      .groupBy(submissions.primaryGpuName)

    // Merge aliased GPUs for ranking
    const mergedRankings = new Map<string, { totalTps: number; count: number }>()
    for (const stat of rawGpuStats) {
      const gpuCanonical = getCanonicalName(stat.gpuName!)
      const existing = mergedRankings.get(gpuCanonical)
      if (existing) {
        existing.totalTps += Number(stat.totalTps) || 0
        existing.count += stat.count
      } else {
        mergedRankings.set(gpuCanonical, {
          totalTps: Number(stat.totalTps) || 0,
          count: stat.count,
        })
      }
    }

    // Sort by average tokens per second
    const sortedGpus = Array.from(mergedRankings.entries())
      .map(([name, stats]) => ({
        name,
        avgTps: stats.count > 0 ? stats.totalTps / stats.count : 0,
      }))
      .sort((a, b) => b.avgTps - a.avgTps)

    const rank = sortedGpus.findIndex(g => g.name === canonicalName) + 1
    const totalGpus = sortedGpus.length || 1
    const percentile = Math.round(((totalGpus - rank) / totalGpus) * 100)

    // Get submissions for this GPU (including all name variants)
    const allSubmissions = await db
      .select({
        id: submissions.id,
        cpuName: submissions.cpuName,
        model: submissions.model,
        modelParametersB: submissions.modelParametersB,
        quantization: submissions.quantization,
        backend: submissions.backend,
        contextLength: submissions.contextLength,
        tokensPerSecond: submissions.tokensPerSecond,
        prefillTokensPerSecond: submissions.prefillTokensPerSecond,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(inArray(submissions.primaryGpuName, nameVariants))
      .orderBy(desc(submissions.tokensPerSecond))
      .limit(MAX_SUBMISSIONS_PER_DETAIL)

    const avgTps = Number(gpuStats.avgTokensPerSecond) || 0
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

    return NextResponse.json({
      name: canonicalName,
      vendor,
      vram_mb: gpuData?.vram_mb || 0,
      architecture: gpuData?.architecture || null,
      submission_count: gpuStats.submissionCount,
      avg_tokens_per_second: Math.round(avgTps * 100) / 100,
      rank,
      percentile,
      msrp_usd: msrpUsd,
      used_price_usd: usedPriceUsd,
      value_score: valueScore,
      used_value_score: usedValueScore,
      all_submissions: allSubmissions.map(sub => ({
        id: sub.id,
        cpu_name: sub.cpuName,
        model: sub.model,
        model_parameters_b: sub.modelParametersB,
        quantization: sub.quantization,
        backend: sub.backend,
        context_length: sub.contextLength,
        tokens_per_second: sub.tokensPerSecond,
        prefill_tokens_per_second: sub.prefillTokensPerSecond,
        created_at: sub.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
