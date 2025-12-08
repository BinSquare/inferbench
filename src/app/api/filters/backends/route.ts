import { db, submissions } from '@/db'
import { count, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backends = await db
      .select({
        backend: submissions.backend,
        count: count(),
      })
      .from(submissions)
      .groupBy(submissions.backend)
      .orderBy(desc(count()))

    return NextResponse.json(backends)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
