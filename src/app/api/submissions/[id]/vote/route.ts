import { db, submissions, submissionQuestions } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { votePayloadSchema, validateRequestBody } from '@/lib/validation'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      )
    }

    // Validate request body with Zod
    const validation = await validateRequestBody(request, votePayloadSchema)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { type, reason } = validation.data

    // Check if submission exists
    const [submission] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1)

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Increment the appropriate counter
    if (type === 'validate') {
      await db
        .update(submissions)
        .set({
          validationCount: sql`${submissions.validationCount} + 1`,
        })
        .where(eq(submissions.id, id))
    } else {
      // Store the question with reason (Zod validation guarantees reason exists for 'question' type)
      await db.insert(submissionQuestions).values({
        submissionId: id,
        reason: reason!.trim(),
      })

      await db
        .update(submissions)
        .set({
          questionCount: sql`${submissions.questionCount} + 1`,
        })
        .where(eq(submissions.id, id))
    }

    // Return updated counts
    const [updated] = await db
      .select({
        validationCount: submissions.validationCount,
        questionCount: submissions.questionCount,
      })
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1)

    return NextResponse.json({
      success: true,
      validation_count: updated.validationCount,
      question_count: updated.questionCount,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
