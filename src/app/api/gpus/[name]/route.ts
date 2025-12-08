import { db, gpus, submissions } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'

const MAX_NAME_LENGTH = 200
const MAX_SUBMISSIONS_PER_DETAIL = 500

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

    // Get GPU info
    const [gpu] = await db
      .select()
      .from(gpus)
      .where(eq(gpus.name, decodedName))
      .limit(1)

    if (!gpu) {
      return NextResponse.json({ error: 'GPU not found' }, { status: 404 })
    }

    // Get GPU rank by tokens per second
    const allGpus = await db
      .select({ name: gpus.name, avgTps: gpus.avgTokensPerSecond })
      .from(gpus)
      .orderBy(desc(gpus.avgTokensPerSecond))

    const rank = allGpus.findIndex(g => g.name === decodedName) + 1
    const totalGpus = allGpus.length || 1
    const percentile = Math.round(((totalGpus - rank) / totalGpus) * 100)

    // Get submissions for this GPU (limited to prevent abuse)
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
      id: gpu.id,
      name: gpu.name,
      vendor: gpu.vendor,
      vram_mb: gpu.vramMb,
      architecture: gpu.architecture,
      submission_count: gpu.submissionCount,
      avg_score: gpu.avgScore,
      avg_tokens_per_second: gpu.avgTokensPerSecond,
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
