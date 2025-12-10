import { db, submissions } from '@/db'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'
import { MODEL_LIST } from '@/lib/hardware-data'

// Create lookup maps from hardware data
const modelParamsMap = new Map(MODEL_LIST.map(m => [m.name, m.parameters_b]))
const modelContextMap = new Map(MODEL_LIST.map(m => [m.name, m.context_length]))

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const vendor = searchParams.get('vendor')
    const { limit, offset } = parsePaginationParams(searchParams)

    // Compute model stats directly from submissions table
    const modelStats = await db
      .select({
        model: submissions.model,
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
        avgParametersB: sql<number>`avg(${submissions.modelParametersB})`,
      })
      .from(submissions)
      .groupBy(submissions.model)

    // Build entries with all model info
    let entries = modelStats.map((stat) => {
      const modelName = stat.model
      const displayName = modelName.split('/').pop()?.replace(/-/g, ' ') || modelName
      const modelVendor = modelName.split('/')[0] || 'Unknown'
      const avgTps = Number(stat.avgTokensPerSecond) || 0

      // Get parameters from lookup or from submissions average
      const parametersB = modelParamsMap.get(modelName) || Number(stat.avgParametersB) || null
      const contextLength = modelContextMap.get(modelName) || null

      return {
        name: modelName,
        display_name: displayName,
        vendor: modelVendor,
        parameters_b: parametersB,
        context_length: contextLength,
        submission_count: stat.submissionCount,
        avg_tokens_per_second: Math.round(avgTps * 100) / 100,
      }
    })

    // Filter by vendor if specified
    if (vendor) {
      entries = entries.filter(e => e.vendor === vendor)
    }

    const totalModels = entries.length || 1

    // Sort by avg tokens per second descending
    entries.sort((a, b) => b.avg_tokens_per_second - a.avg_tokens_per_second)

    // Apply pagination and add ranks
    entries = entries.slice(offset, offset + limit).map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
      percentile: Math.round(((totalModels - (offset + index + 1)) / totalModels) * 100),
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
