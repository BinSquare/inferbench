import { db, submissions } from '@/db'
import { desc, eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { MODEL_LIST } from '@/lib/hardware-data'

const MAX_NAME_LENGTH = 300  // Model names can be longer (e.g., huggingface paths)
const MAX_SUBMISSIONS_PER_DETAIL = 500

// Create lookup maps from hardware data
const modelParamsMap = new Map(MODEL_LIST.map(m => [m.name, m.parameters_b]))
const modelContextMap = new Map(MODEL_LIST.map(m => [m.name, m.context_length]))

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    // Validate name length
    if (!name || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Invalid model name' }, { status: 400 })
    }

    const decodedName = decodeURIComponent(name)

    // Get model stats from submissions
    const [modelStats] = await db
      .select({
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
        avgParametersB: sql<number>`avg(${submissions.modelParametersB})`,
      })
      .from(submissions)
      .where(eq(submissions.model, decodedName))

    if (!modelStats || modelStats.submissionCount === 0) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Get model info from static data or derive from name
    const displayName = decodedName.split('/').pop()?.replace(/-/g, ' ') || decodedName
    const vendor = decodedName.split('/')[0] || 'Unknown'
    const parametersB = modelParamsMap.get(decodedName) || Number(modelStats.avgParametersB) || null
    const contextLength = modelContextMap.get(decodedName) || null

    // Get model rank by avg tokens per second
    const allModelStats = await db
      .select({
        model: submissions.model,
        avgTps: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .groupBy(submissions.model)
      .orderBy(sql`avg(${submissions.tokensPerSecond}) DESC`)

    const rank = allModelStats.findIndex(m => m.model === decodedName) + 1
    const totalModels = allModelStats.length || 1
    const percentile = Math.round(((totalModels - rank) / totalModels) * 100)

    // Get submissions for this model (limited to prevent abuse)
    const allSubmissions = await db
      .select({
        id: submissions.id,
        primaryGpuName: submissions.primaryGpuName,
        cpuName: submissions.cpuName,
        quantization: submissions.quantization,
        backend: submissions.backend,
        contextLength: submissions.contextLength,
        tokensPerSecond: submissions.tokensPerSecond,
        prefillTokensPerSecond: submissions.prefillTokensPerSecond,
        totalVramMb: submissions.totalVramMb,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(eq(submissions.model, decodedName))
      .orderBy(desc(submissions.tokensPerSecond))
      .limit(MAX_SUBMISSIONS_PER_DETAIL)

    return NextResponse.json({
      name: decodedName,
      display_name: displayName,
      vendor,
      parameters_b: parametersB,
      context_length: contextLength,
      submission_count: modelStats.submissionCount,
      avg_tokens_per_second: Math.round(Number(modelStats.avgTokensPerSecond) * 100) / 100,
      rank,
      percentile,
      all_submissions: allSubmissions.map(sub => ({
        id: sub.id,
        gpu_name: sub.primaryGpuName,
        cpu_name: sub.cpuName,
        quantization: sub.quantization,
        backend: sub.backend,
        context_length: sub.contextLength,
        tokens_per_second: sub.tokensPerSecond,
        prefill_tokens_per_second: sub.prefillTokensPerSecond,
        total_vram_mb: sub.totalVramMb,
        created_at: sub.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
