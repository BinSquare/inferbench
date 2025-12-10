import { db, submissions } from '@/db'
import { count, avg, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get total submissions
    const [submissionCount] = await db
      .select({ count: count() })
      .from(submissions)

    // Get total unique GPUs (from submissions)
    const [gpuCount] = await db
      .select({ count: sql<number>`count(distinct ${submissions.primaryGpuName})` })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)

    // Get total unique CPUs (from submissions)
    const [cpuCount] = await db
      .select({ count: sql<number>`count(distinct ${submissions.cpuName})` })
      .from(submissions)
      .where(sql`${submissions.cpuName} IS NOT NULL`)

    // Get average tokens per second
    const [avgTps] = await db
      .select({ avg: avg(submissions.tokensPerSecond) })
      .from(submissions)

    // Get top performing GPUs by average tokens per second
    const topGpus = await db
      .select({
        name: submissions.primaryGpuName,
        avgTps: sql<number>`avg(${submissions.tokensPerSecond})`,
      })
      .from(submissions)
      .where(sql`${submissions.primaryGpuName} IS NOT NULL`)
      .groupBy(submissions.primaryGpuName)
      .orderBy(sql`avg(${submissions.tokensPerSecond}) DESC`)
      .limit(5)

    const topPerformers = topGpus.map(g => ({
      gpu: g.name,
      tokens_per_second: Math.round(Number(g.avgTps) * 100) / 100,
    }))

    return NextResponse.json({
      total_submissions: Number(submissionCount?.count) || 0,
      total_gpus: Number(gpuCount?.count) || 0,
      total_cpus: Number(cpuCount?.count) || 0,
      average_tokens_per_second: Math.round(Number(avgTps?.avg) * 100) / 100 || 0,
      top_performers: topPerformers,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
