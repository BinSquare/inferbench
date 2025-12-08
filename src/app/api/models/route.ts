import { db, models } from '@/db'
import { desc, eq, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const vendor = searchParams.get('vendor')
    const { limit, offset } = parsePaginationParams(searchParams)

    let data
    if (vendor) {
      data = await db
        .select()
        .from(models)
        .where(eq(models.vendor, vendor))
        .orderBy(desc(models.avgTokensPerSecond))
        .limit(limit)
        .offset(offset)
    } else {
      data = await db
        .select()
        .from(models)
        .orderBy(desc(models.avgTokensPerSecond))
        .limit(limit)
        .offset(offset)
    }

    // Get total count for percentile calculation
    const [countResult] = await db
      .select({ count: count() })
      .from(models)

    const totalModels = Number(countResult?.count) || data.length || 1

    // Add rank and percentile to each entry
    const entries = data.map((model, index) => ({
      id: model.id,
      name: model.name,
      display_name: model.displayName,
      vendor: model.vendor,
      parameters_b: model.parametersB,
      context_length: model.contextLength,
      huggingface_url: model.huggingfaceUrl,
      submission_count: model.submissionCount,
      avg_tokens_per_second: model.avgTokensPerSecond,
      rank: offset + index + 1,
      percentile: Math.round(((totalModels - (offset + index + 1)) / totalModels) * 100),
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
