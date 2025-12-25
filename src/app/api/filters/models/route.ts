import { db, submissions } from '@/db'
import { count, desc, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const models = await db
      .select({
        model: submissions.model,
        count: count(),
      })
      .from(submissions)
      .where(sql`${submissions.model} IS NOT NULL AND TRIM(${submissions.model}) != ''`)
      .groupBy(submissions.model)
      .orderBy(desc(count()))

    // Filter out any remaining invalid entries (unknown, null strings, etc.)
    const validModels = models.filter((m) => {
      if (!m.model) return false
      const trimmed = m.model.trim().toLowerCase()
      return trimmed !== '' && trimmed !== 'unknown' && trimmed !== 'null' && trimmed !== 'undefined'
    })

    // Return with caching headers - filter options don't change frequently
    return NextResponse.json(validModels, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
