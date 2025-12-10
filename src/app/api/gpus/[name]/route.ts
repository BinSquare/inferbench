import { db, submissions } from '@/db'
import { desc, eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { GPU_LIST } from '@/lib/hardware-data'

const MAX_NAME_LENGTH = 200
const MAX_SUBMISSIONS_PER_DETAIL = 500

// GPU name aliases (same as in /api/gpus)
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

    // Get GPU stats from submissions
    const [gpuStats] = await db
      .select({
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(eq(submissions.primaryGpuName, decodedName))

    if (!gpuStats || gpuStats.submissionCount === 0) {
      return NextResponse.json({ error: 'GPU not found' }, { status: 404 })
    }

    // Get GPU spec data from hardware-data.ts
    const gpuData = lookupGpuData(decodedName)

    // Infer vendor from name if not in lookup
    let vendor: string = gpuData?.vendor || ''
    if (!vendor) {
      if (decodedName.startsWith('NVIDIA')) vendor = 'NVIDIA'
      else if (decodedName.startsWith('AMD')) vendor = 'AMD'
      else if (decodedName.startsWith('Apple')) vendor = 'Apple'
      else if (decodedName.startsWith('Intel')) vendor = 'Intel'
      else vendor = 'Other'
    }

    // Get all GPU rankings to compute rank/percentile
    const allGpuStats = await db
      .select({
        gpuName: submissions.primaryGpuName,
        avgTps: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)
      .groupBy(submissions.primaryGpuName)
      .orderBy(sql`avg(${submissions.tokensPerSecond}) DESC`)

    const rank = allGpuStats.findIndex(g => g.gpuName === decodedName) + 1
    const totalGpus = allGpuStats.length || 1
    const percentile = Math.round(((totalGpus - rank) / totalGpus) * 100)

    // Get submissions for this GPU
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
      .where(eq(submissions.primaryGpuName, decodedName))
      .orderBy(desc(submissions.tokensPerSecond))
      .limit(MAX_SUBMISSIONS_PER_DETAIL)

    return NextResponse.json({
      name: decodedName,
      vendor,
      vram_mb: gpuData?.vram_mb || 0,
      architecture: gpuData?.architecture || null,
      submission_count: gpuStats.submissionCount,
      avg_tokens_per_second: Math.round(Number(gpuStats.avgTokensPerSecond) * 100) / 100,
      rank,
      percentile,
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
