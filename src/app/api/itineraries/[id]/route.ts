import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, updateItinerarySchema } from '@/lib/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    const itinerary = await db.itinerary.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        days_plan: {
          include: {
            activities: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
        budget_items: true,
        companions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    const parsedItinerary = {
      ...itinerary,
      activities: JSON.parse(itinerary.activities),
      requirements: itinerary.requirements ? JSON.parse(itinerary.requirements) : [],
      budget_items: itinerary.budget_items.map((item) => ({
        ...item,
        splitAmong: JSON.parse(item.splitAmong),
      })),
      posts: itinerary.posts.map((post) => ({
        ...post,
        images: JSON.parse(post.images),
        tags: post.tags ? JSON.parse(post.tags) : [],
      })),
    }

    return NextResponse.json({ itinerary: parsedItinerary })
  } catch (error) {
    console.error('Get itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const existingItinerary = await db.itinerary.findUnique({
      where: { id },
    })

    if (!existingItinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    const {
      title,
      country,
      location,
      budget,
      currency,
      days,
      travelType,
      activities,
      isPublic,
      requirements,
      status,
    } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (country !== undefined) updateData.country = country
    if (location !== undefined) updateData.location = location
    if (budget !== undefined) updateData.budget = budget
    if (currency !== undefined) updateData.currency = currency
    if (days !== undefined) updateData.days = days
    if (travelType !== undefined) updateData.travelType = travelType
    if (activities !== undefined) updateData.activities = JSON.stringify(activities)
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (requirements !== undefined) updateData.requirements = JSON.stringify(requirements)
    if (status !== undefined) {
      const validStatuses = ['pre-travel', 'during-travel', 'post-travel']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    const itinerary = await db.itinerary.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        days_plan: {
          include: {
            activities: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
        budget_items: true,
        companions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    const parsedItinerary = {
      ...itinerary,
      activities: JSON.parse(itinerary.activities),
      requirements: itinerary.requirements ? JSON.parse(itinerary.requirements) : [],
      budget_items: itinerary.budget_items.map((item) => ({
        ...item,
        splitAmong: JSON.parse(item.splitAmong),
      })),
    }

    return NextResponse.json({ itinerary: parsedItinerary })
  } catch (error) {
    console.error('Update itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    const existingItinerary = await db.itinerary.findUnique({
      where: { id },
    })

    if (!existingItinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    // Delete in order due to foreign key constraints
    // DayActivities are cascade-deleted via ItineraryDay, so we need to delete days first
    await db.dayActivity.deleteMany({
      where: {
        itineraryDay: {
          itineraryId: id,
        },
      },
    })

    await db.itineraryDay.deleteMany({
      where: { itineraryId: id },
    })

    await db.budgetItem.deleteMany({
      where: { itineraryId: id },
    })

    await db.companion.deleteMany({
      where: { itineraryId: id },
    })

    await db.post.updateMany({
      where: { itineraryId: id },
      data: { itineraryId: null },
    })

    await db.itinerary.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Itinerary deleted successfully' })
  } catch (error) {
    console.error('Delete itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
