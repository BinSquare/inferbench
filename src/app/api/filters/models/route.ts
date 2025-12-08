import { db, submissions } from '@/db'
import { count, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const models = await db
      .select({
        model: submissions.model,
        count: count(),
      })
      .from(submissions)
      .groupBy(submissions.model)
      .orderBy(desc(count()))

    return NextResponse.json(models)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
