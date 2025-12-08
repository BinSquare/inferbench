import { db, submissions, gpus, cpus } from '@/db'
import { count, avg, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get total submissions
    const [submissionCount] = await db
      .select({ count: count() })
      .from(submissions)

    // Get total unique GPUs
    const [gpuCount] = await db
      .select({ count: count() })
      .from(gpus)

    // Get total unique CPUs
    const [cpuCount] = await db
      .select({ count: count() })
      .from(cpus)

    // Get average tokens per second
    const [avgTps] = await db
      .select({ avg: avg(submissions.tokensPerSecond) })
      .from(submissions)

    // Get top performing GPUs by tokens per second
    const topGpus = await db
      .select({
        name: gpus.name,
        avgTps: gpus.avgTokensPerSecond,
      })
      .from(gpus)
      .orderBy(desc(gpus.avgTokensPerSecond))
      .limit(3)

    // Get top performing CPUs by tokens per second
    const topCpus = await db
      .select({
        name: cpus.name,
        avgTps: cpus.avgTokensPerSecond,
      })
      .from(cpus)
      .orderBy(desc(cpus.avgTokensPerSecond))
      .limit(2)

    const topPerformers = [
      ...topGpus.map(g => ({ gpu: g.name, tokens_per_second: g.avgTps })),
      ...topCpus.map(c => ({ gpu: c.name, tokens_per_second: c.avgTps })),
    ].sort((a, b) => b.tokens_per_second - a.tokens_per_second).slice(0, 5)

    return NextResponse.json({
      total_submissions: Number(submissionCount?.count) || 0,
      total_gpus: Number(gpuCount?.count) || 0,
      total_cpus: Number(cpuCount?.count) || 0,
      average_tokens_per_second: Number(avgTps?.avg) || 0,
      top_performers: topPerformers,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
