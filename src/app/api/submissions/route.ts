import { db, submissions, submissionGpus, gpus, cpus, models } from '@/db'
import { eq, avg, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import {
  submissionPayloadSchema,
  type SubmissionPayload,
  validateRequestBody,
} from '@/lib/validation'

function calculateScore(tokensPerSecond: number, latencyP50?: number | null): number {
  // Validate inputs to prevent NaN/Infinity
  if (!Number.isFinite(tokensPerSecond) || tokensPerSecond <= 0) {
    return 0
  }

  const tpsScore = tokensPerSecond / 10
  const latencyScore =
    latencyP50 && Number.isFinite(latencyP50) && latencyP50 > 0
      ? 1000 / latencyP50
      : 0

  const score = Math.round((tpsScore * 0.7 + latencyScore * 0.3) * 10)

  // Ensure score is within bounds and finite
  if (!Number.isFinite(score)) return 0
  return Math.min(Math.max(score, 0), 100)
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body with Zod schema
    const validation = await validateRequestBody(request, submissionPayloadSchema)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const payload = validation.data

    // Calculate GPU totals
    const gpuList = payload.hardware.gpus || []
    const totalGpuCount = gpuList.reduce((sum, gpu) => sum + gpu.quantity, 0)
    const totalVramMb = gpuList.reduce((sum, gpu) => sum + (gpu.vram_mb * gpu.quantity), 0)
    const primaryGpuName = gpuList.length > 0 ? gpuList[0].name : null

    // Calculate score if not provided
    const score = payload.results.score ?? calculateScore(
      payload.results.tokens_per_second,
      payload.results.latency?.p50_ms
    )

    // Insert submission
    const [submission] = await db.insert(submissions).values({
      // Hardware - GPU totals
      totalGpuCount,
      totalVramMb,
      primaryGpuName,

      // Hardware - CPU
      cpuName: payload.hardware.cpu.model,
      cpuVendor: payload.hardware.cpu.vendor,
      cpuCores: payload.hardware.cpu.cores,
      cpuThreads: payload.hardware.cpu.threads,

      // Hardware - RAM
      ramMb: payload.hardware.memory.total_mb,
      ramSpeedMhz: payload.hardware.memory.speed_mhz || null,
      ramType: payload.hardware.memory.type || null,

      // System
      os: payload.hardware.os,
      arch: payload.hardware.arch,

      // Benchmark config
      model: payload.benchmark.model,
      modelParametersB: payload.benchmark.model_parameters_b || null,
      quantization: payload.benchmark.quantization || null,
      contextLength: payload.benchmark.context_length || null,
      backend: payload.benchmark.backend,
      backendVersion: payload.benchmark.backend_version || null,
      promptTokens: payload.benchmark.prompt_tokens || null,
      generationTokens: payload.benchmark.generation_tokens || null,
      batchSize: payload.benchmark.batch_size || 1,

      // Results
      tokensPerSecond: payload.results.tokens_per_second,
      prefillTokensPerSecond: payload.results.prefill_tokens_per_second || null,
      timeToFirstTokenMs: payload.results.time_to_first_token_ms || null,
      latencyP50Ms: payload.results.latency?.p50_ms || null,
      latencyP90Ms: payload.results.latency?.p90_ms || null,
      latencyP99Ms: payload.results.latency?.p99_ms || null,
      vramUsedMb: payload.results.vram_used_mb || null,
      ramUsedMb: payload.results.ram_used_mb || null,
      powerDrawWatts: payload.results.power_draw_watts || null,
      score,

      // Metadata
      submitterNotes: payload.metadata?.notes || null,
      sourceUrl: payload.source_url || null,
    }).returning()

    // Insert GPU entries into junction table
    if (gpuList.length > 0) {
      await db.insert(submissionGpus).values(
        gpuList.map(gpu => ({
          submissionId: submission.id,
          gpuName: gpu.name,
          gpuVendor: gpu.vendor,
          gpuVramMb: gpu.vram_mb,
          quantity: gpu.quantity,
          interconnect: gpu.interconnect || null,
        }))
      )

      // Update GPU stats for each unique GPU
      for (const gpu of gpuList) {
        await upsertGpuStats(gpu)
      }
    }

    // Update CPU stats
    await upsertCpuStats(payload.hardware.cpu)

    // Update model stats
    await upsertModelStats(payload.benchmark.model, payload.benchmark.model_parameters_b ?? undefined)

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      score,
      total_gpu_count: totalGpuCount,
      total_vram_mb: totalVramMb,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function upsertGpuStats(gpu: { name: string; vendor: string; vram_mb: number }) {
  // Count submissions that include this GPU
  const [stats] = await db
    .select({
      count: count(),
    })
    .from(submissionGpus)
    .where(eq(submissionGpus.gpuName, gpu.name))

  // Get average scores from submissions that use this GPU
  const submissionsWithGpu = await db
    .select({
      score: submissions.score,
      tokensPerSecond: submissions.tokensPerSecond,
    })
    .from(submissions)
    .innerJoin(submissionGpus, eq(submissions.id, submissionGpus.submissionId))
    .where(eq(submissionGpus.gpuName, gpu.name))

  const submissionCount = submissionsWithGpu.length
  const avgScore = submissionCount > 0
    ? submissionsWithGpu.reduce((sum, s) => sum + s.score, 0) / submissionCount
    : 0
  const avgTps = submissionCount > 0
    ? submissionsWithGpu.reduce((sum, s) => sum + s.tokensPerSecond, 0) / submissionCount
    : 0

  const [existingGpu] = await db
    .select()
    .from(gpus)
    .where(eq(gpus.name, gpu.name))
    .limit(1)

  if (existingGpu) {
    await db
      .update(gpus)
      .set({
        submissionCount,
        avgScore,
        avgTokensPerSecond: avgTps,
      })
      .where(eq(gpus.name, gpu.name))
  } else {
    await db.insert(gpus).values({
      name: gpu.name,
      vendor: gpu.vendor,
      vramMb: gpu.vram_mb,
      submissionCount,
      avgScore,
      avgTokensPerSecond: avgTps,
    })
  }
}

async function upsertCpuStats(cpu: { model: string; vendor: string; cores: number; threads: number }) {
  const [stats] = await db
    .select({
      count: count(),
      avgScore: avg(submissions.score),
      avgTps: avg(submissions.tokensPerSecond),
    })
    .from(submissions)
    .where(eq(submissions.cpuName, cpu.model))

  const submissionCount = Number(stats?.count) || 0
  const avgScore = Number(stats?.avgScore) || 0
  const avgTps = Number(stats?.avgTps) || 0

  const [existingCpu] = await db
    .select()
    .from(cpus)
    .where(eq(cpus.name, cpu.model))
    .limit(1)

  if (existingCpu) {
    await db
      .update(cpus)
      .set({
        submissionCount,
        avgScore,
        avgTokensPerSecond: avgTps,
      })
      .where(eq(cpus.name, cpu.model))
  } else {
    await db.insert(cpus).values({
      name: cpu.model,
      vendor: cpu.vendor,
      cores: cpu.cores,
      threads: cpu.threads,
      submissionCount,
      avgScore,
      avgTokensPerSecond: avgTps,
    })
  }
}

async function upsertModelStats(modelName: string, parametersB?: number) {
  const [stats] = await db
    .select({
      count: count(),
      avgScore: avg(submissions.score),
      avgTps: avg(submissions.tokensPerSecond),
    })
    .from(submissions)
    .where(eq(submissions.model, modelName))

  const submissionCount = Number(stats?.count) || 0
  const avgScore = Number(stats?.avgScore) || 0
  const avgTps = Number(stats?.avgTps) || 0

  const [existingModel] = await db
    .select()
    .from(models)
    .where(eq(models.name, modelName))
    .limit(1)

  if (existingModel) {
    await db
      .update(models)
      .set({
        submissionCount,
        avgScore,
        avgTokensPerSecond: avgTps,
      })
      .where(eq(models.name, modelName))
  } else {
    // Extract vendor and display name from model ID
    const parts = modelName.split('/')
    const vendor = parts.length > 1 ? parts[0] : 'Unknown'
    const displayName = parts.length > 1 ? parts[1] : modelName

    await db.insert(models).values({
      name: modelName,
      displayName,
      vendor,
      parametersB: parametersB || 0,
      submissionCount,
      avgScore,
      avgTokensPerSecond: avgTps,
    })
  }
}

export async function GET() {
  try {
    // Get submissions with their GPUs
    const data = await db.query.submissions.findMany({
      orderBy: (submissions, { desc }) => [desc(submissions.tokensPerSecond)],
      limit: 100,
      with: {
        gpus: true,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
