import { db, submissions } from '@/db'
import { desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, offset } = parsePaginationParams(searchParams)

    const data = await db
      .select({
        id: submissions.id,
        primaryGpuName: submissions.primaryGpuName,
        cpuName: submissions.cpuName,
        model: submissions.model,
        backend: submissions.backend,
        quantization: submissions.quantization,
        contextLength: submissions.contextLength,
        tokensPerSecond: submissions.tokensPerSecond,
        createdAt: submissions.createdAt,
        validationCount: submissions.validationCount,
        questionCount: submissions.questionCount,
        sourceUrl: submissions.sourceUrl,
      })
      .from(submissions)
      .orderBy(desc(submissions.createdAt))
      .limit(limit)
      .offset(offset)

    const entries = data.map(sub => ({
      id: sub.id,
      primary_gpu_name: sub.primaryGpuName,
      cpu_name: sub.cpuName,
      model: sub.model,
      backend: sub.backend,
      quantization: sub.quantization,
      context_length: sub.contextLength,
      tokens_per_second: sub.tokensPerSecond,
      created_at: sub.createdAt.toISOString(),
      validation_count: sub.validationCount,
      question_count: sub.questionCount,
      source_url: sub.sourceUrl,
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
