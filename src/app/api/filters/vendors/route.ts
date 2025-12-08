import { db, submissionGpus } from '@/db'
import { count, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendors = await db
      .select({
        vendor: submissionGpus.gpuVendor,
        count: count(),
      })
      .from(submissionGpus)
      .groupBy(submissionGpus.gpuVendor)
      .orderBy(desc(count()))

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
