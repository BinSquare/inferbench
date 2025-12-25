import { db, submissions } from '@/db'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'
import { MODEL_LIST } from '@/lib/hardware-data'

// Model name aliases to normalize common variations (variant -> canonical)
// This merges submissions with different naming conventions into one entry
const MODEL_NAME_ALIASES: Record<string, string> = {
  // Llama variations (with/without Meta- prefix, different casing)
  'meta-llama/llama-3.1-8b-instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'meta-llama/llama-3.1-70b-instruct': 'meta-llama/Llama-3.1-70B-Instruct',
  'meta-llama/llama-3-8b-instruct': 'meta-llama/Meta-Llama-3-8B-Instruct',
  'meta-llama/llama-3-70b-instruct': 'meta-llama/Meta-Llama-3-70B-Instruct',
  'Meta-Llama-3-8B-Instruct': 'meta-llama/Meta-Llama-3-8B-Instruct',
  'Meta-Llama-3-70B-Instruct': 'meta-llama/Meta-Llama-3-70B-Instruct',
  'Llama-3.1-8B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'Llama-3.1-70B-Instruct': 'meta-llama/Llama-3.1-70B-Instruct',
  'Llama-3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',

  // Qwen variations
  'Qwen/Qwen2.5-72B-Instruct': 'Qwen/Qwen2.5-72B-Instruct',
  'qwen/qwen2.5-72b-instruct': 'Qwen/Qwen2.5-72B-Instruct',
  'Qwen2.5-72B-Instruct': 'Qwen/Qwen2.5-72B-Instruct',
  'Qwen2.5-7B-Instruct': 'Qwen/Qwen2.5-7B-Instruct',

  // Mistral variations
  'mistralai/mistral-7b-instruct-v0.3': 'mistralai/Mistral-7B-Instruct-v0.3',
  'Mistral-7B-Instruct-v0.3': 'mistralai/Mistral-7B-Instruct-v0.3',

  // DeepSeek variations
  'deepseek-ai/deepseek-v3': 'deepseek-ai/DeepSeek-V3',
  'DeepSeek-V3': 'deepseek-ai/DeepSeek-V3',
}

// Get canonical name for any model name (applies alias if exists)
function getCanonicalModelName(name: string): string {
  // Try exact match first
  if (MODEL_NAME_ALIASES[name]) return MODEL_NAME_ALIASES[name]
  // Try lowercase match
  const lower = name.toLowerCase()
  for (const [alias, canonical] of Object.entries(MODEL_NAME_ALIASES)) {
    if (alias.toLowerCase() === lower) return canonical
  }
  return name
}

// Create lookup maps from hardware data
const modelParamsMap = new Map(MODEL_LIST.map(m => [m.name, m.parameters_b]))
const modelContextMap = new Map(MODEL_LIST.map(m => [m.name, m.context_length]))
const modelDisplayNameMap = new Map(MODEL_LIST.map(m => [m.name, m.displayName]))
const modelVendorMap = new Map(MODEL_LIST.map(m => [m.name, m.vendor]))

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const vendor = searchParams.get('vendor')
    const { limit, offset } = parsePaginationParams(searchParams)

    // Compute model stats directly from submissions table
    // Filter invalid entries at SQL level for better performance
    const modelStats = await db
      .select({
        model: submissions.model,
        submissionCount: sql<number>`count(*)::int`,
        avgTokensPerSecond: sql<number>`avg(${submissions.tokensPerSecond})`,
        totalTokensPerSecond: sql<number>`sum(${submissions.tokensPerSecond})`,
        avgParametersB: sql<number>`avg(${submissions.modelParametersB})`,
      })
      .from(submissions)
      .where(sql`
        ${submissions.model} IS NOT NULL
        AND TRIM(${submissions.model}) != ''
        AND LOWER(TRIM(${submissions.model})) NOT IN ('unknown', 'null', 'undefined', 'n/a', 'none')
      `)
      .groupBy(submissions.model)

    // Merge entries with aliased names into their canonical name
    const mergedStats = new Map<string, {
      submissionCount: number
      totalTokensPerSecond: number
      avgParametersB: number | null
    }>()

    for (const stat of modelStats) {
      if (!stat.model) continue
      const rawName = stat.model.trim()
      const canonicalName = getCanonicalModelName(rawName)
      const existing = mergedStats.get(canonicalName)

      if (existing) {
        existing.submissionCount += stat.submissionCount
        existing.totalTokensPerSecond += Number(stat.totalTokensPerSecond) || 0
        // Keep the first non-null avgParametersB
        if (existing.avgParametersB === null && stat.avgParametersB) {
          existing.avgParametersB = Number(stat.avgParametersB)
        }
      } else {
        mergedStats.set(canonicalName, {
          submissionCount: stat.submissionCount,
          totalTokensPerSecond: Number(stat.totalTokensPerSecond) || 0,
          avgParametersB: stat.avgParametersB ? Number(stat.avgParametersB) : null,
        })
      }
    }

    // Build entries from merged stats
    let entries = Array.from(mergedStats.entries()).map(([modelName, stats]) => {
      const avgTps = stats.submissionCount > 0
        ? stats.totalTokensPerSecond / stats.submissionCount
        : 0

      // Use lookup maps from MODEL_LIST for accurate metadata, fallback to parsing from name
      const displayName = modelDisplayNameMap.get(modelName)
        || modelName.split('/').pop()?.replace(/-/g, ' ')
        || modelName

      // Get vendor from lookup, or extract from model name path (e.g., "meta-llama/...")
      const modelVendor = modelVendorMap.get(modelName)
        || (modelName.includes('/') ? modelName.split('/')[0] : 'Unknown')

      // Get parameters from lookup or from submissions average
      const parametersB = modelParamsMap.get(modelName) || stats.avgParametersB || null
      const contextLength = modelContextMap.get(modelName) || null

      return {
        name: modelName,
        display_name: displayName,
        vendor: modelVendor,
        parameters_b: parametersB,
        context_length: contextLength,
        submission_count: stats.submissionCount,
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

    // Return with caching headers - model stats don't change frequently
    return NextResponse.json(entries, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
