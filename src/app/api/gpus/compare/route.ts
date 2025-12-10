import { db, submissions } from '@/db'
import { inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'

const MAX_GPU_NAME_LENGTH = 200

// GPU name aliases
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

    // Get stats for requested GPUs from submissions
    const gpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(inArray(submissions.primaryGpuName, names))
      .groupBy(submissions.primaryGpuName)

    // Get all GPUs for total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(distinct ${submissions.primaryGpuName})` })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)

    const totalGpus = Number(totalResult?.count) || gpuStats.length || 1

    // Build comparisons with GPU data
    const comparisons = gpuStats
      .map((stat) => {
        const gpuName = stat.gpuName!
        const gpuData = lookupGpuData(gpuName)
        const avgTps = Number(stat.avgTokensPerSecond) || 0

        // Infer vendor from name if not in lookup
        let vendor: string = gpuData?.vendor || ''
        if (!vendor) {
          if (gpuName.startsWith('NVIDIA')) vendor = 'NVIDIA'
          else if (gpuName.startsWith('AMD')) vendor = 'AMD'
          else if (gpuName.startsWith('Apple')) vendor = 'Apple'
          else if (gpuName.startsWith('Intel')) vendor = 'Intel'
          else vendor = 'Other'
        }

        return {
          name: gpuName,
          vendor,
          vram_mb: gpuData?.vram_mb || 0,
          submission_count: stat.submissionCount,
          avg_tokens_per_second: Math.round(avgTps * 100) / 100,
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
