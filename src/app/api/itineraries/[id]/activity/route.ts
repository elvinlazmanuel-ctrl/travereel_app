import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody } from '@/lib/validation'
import { z } from 'zod'

const updateActivitySchema = z.object({
  activityId: z.string().min(1, 'Activity ID is required'),
  status: z.enum(['completed', 'skipped', 'pending'], { message: 'Invalid status. Must be one of: completed, skipped, pending' }),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params
    const body = await request.json()
    const validation = validateBody(updateActivitySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { activityId, status } = validation.data

    // Verify the activity belongs to a day of this itinerary
    const activity = await db.dayActivity.findUnique({
      where: { id: activityId },
      include: {
        itineraryDay: {
          select: { itineraryId: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    if (activity.itineraryDay.itineraryId !== id) {
      return NextResponse.json(
        { error: 'Activity does not belong to this itinerary' },
        { status: 403 }
      )
    }

    const updatedActivity = await db.dayActivity.update({
      where: { id: activityId },
      data: { status },
    })

    return NextResponse.json({ activity: updatedActivity })
  } catch (error) {
    console.error('Update activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
