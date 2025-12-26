import { db, submissions, submissionGpus, submissionQuestions } from '@/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  submissionPayloadSchema,
  validateRequestBody,
} from '@/lib/validation'
import { checkVramPlausibility } from '@/lib/plausibility'
import { getModelParametersB } from '@/lib/hardware-data'

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

    // Check plausibility of VRAM requirements
    let plausibilityWarning: string | null = null
    const modelParametersB = payload.benchmark.model_parameters_b ?? getModelParametersB(payload.benchmark.model)

    if (modelParametersB && totalVramMb > 0) {
      const plausibility = checkVramPlausibility(
        totalVramMb,
        modelParametersB,
        payload.benchmark.quantization ?? null
      )

      if (!plausibility.plausible) {
        plausibilityWarning = plausibility.reason
      }
    }

    // Insert submission
    const [submission] = await db.insert(submissions).values({
      // Hardware - GPU totals
      totalGpuCount,
      totalVramMb,
      primaryGpuName,

      // Hardware - CPU (optional)
      cpuName: payload.hardware.cpu?.model || null,
      cpuVendor: payload.hardware.cpu?.vendor || null,
      cpuCores: payload.hardware.cpu?.cores || null,
      cpuThreads: payload.hardware.cpu?.threads || null,

      // Hardware - RAM (optional)
      ramMb: payload.hardware.memory?.total_mb || null,
      ramSpeedMhz: payload.hardware.memory?.speed_mhz || null,
      ramType: payload.hardware.memory?.type || null,

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
      score: 0, // Deprecated field, kept for schema compatibility

      // Metadata
      submitterNotes: payload.metadata?.notes || null,
      sourceUrl: payload.source_url || null,

      // Set questionCount if plausibility warning
      questionCount: plausibilityWarning ? 1 : 0,
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
    }

    // Insert plausibility warning as a question if flagged
    if (plausibilityWarning) {
      await db.insert(submissionQuestions).values({
        submissionId: submission.id,
        reason: `[Auto-flagged] ${plausibilityWarning}`,
      })
    }

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      total_gpu_count: totalGpuCount,
      total_vram_mb: totalVramMb,
      flagged: plausibilityWarning !== null,
      flag_reason: plausibilityWarning,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
