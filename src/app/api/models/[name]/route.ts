import { db, models, submissions } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

const MAX_NAME_LENGTH = 300  // Model names can be longer (e.g., huggingface paths)
const MAX_SUBMISSIONS_PER_DETAIL = 500

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

    // Get model info
    const [model] = await db
      .select()
      .from(models)
      .where(eq(models.name, decodedName))
      .limit(1)

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Get model rank by tokens per second
    const allModels = await db
      .select({ name: models.name, avgTps: models.avgTokensPerSecond })
      .from(models)
      .orderBy(desc(models.avgTokensPerSecond))

    const rank = allModels.findIndex(m => m.name === decodedName) + 1
    const totalModels = allModels.length || 1
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
      id: model.id,
      name: model.name,
      display_name: model.displayName,
      vendor: model.vendor,
      parameters_b: model.parametersB,
      context_length: model.contextLength,
      huggingface_url: model.huggingfaceUrl,
      submission_count: model.submissionCount,
      avg_tokens_per_second: model.avgTokensPerSecond,
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
