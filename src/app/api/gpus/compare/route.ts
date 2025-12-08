import { db, gpus } from '@/db'
import { desc, inArray, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

const MAX_GPU_NAME_LENGTH = 200

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

    const data = await db
      .select()
      .from(gpus)
      .where(inArray(gpus.name, names))
      .orderBy(desc(gpus.avgTokensPerSecond))

    // Get total count for percentile calculation
    const [countResult] = await db
      .select({ count: count() })
      .from(gpus)

    const totalGpus = Number(countResult?.count) || data.length || 1

    // Map to comparison format with ranks
    const comparisons = data.map((gpu, index) => ({
      name: gpu.name,
      vendor: gpu.vendor,
      vram_mb: gpu.vramMb,
      submission_count: gpu.submissionCount,
      avg_score: gpu.avgScore,
      avg_tokens_per_second: gpu.avgTokensPerSecond,
      rank: index + 1,
      percentile: Math.round(((totalGpus - (index + 1)) / totalGpus) * 100),
    }))

    return NextResponse.json({ comparisons })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
