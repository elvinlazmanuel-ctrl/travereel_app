import { db } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createItinerarySchema, updateItinerarySchema, userIdSchema } from '@/lib/validation'
import { authenticateUser } from '@/lib/auth-middleware'
import { sendPushNotification } from '@/lib/push-sender'

export async function GET(request: NextRequest) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')
    const isPublic = searchParams.get('isPublic')

    if (authorId) {
      const validation = validateQuery(userIdSchema, authorId)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // SECURITY: Authenticate user to check access permissions
    const auth = await authenticateUser(request)
    const currentUserId = auth?.userId

    const where: Record<string, unknown> = {}
    if (authorId) where.authorId = authorId
    
    // SECURITY: Only return public itineraries unless user is the owner
    if (isPublic === 'true') {
      where.isPublic = true
    } else if (authorId && currentUserId && authorId === currentUserId) {
      // Owner can see their own itineraries (both public and private)
      // No isPublic filter needed
    } else if (authorId) {
      // Viewing someone else's itineraries - only show public ones
      where.isPublic = true
    }
    // If no authorId specified, return all public itineraries

    const itineraries = await db.itinerary.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    const parsedItineraries = itineraries.map((itinerary) => ({
      ...itinerary,
      activities: JSON.parse(itinerary.activities),
      requirements: itinerary.requirements ? JSON.parse(itinerary.requirements) : [],
      budget_items: itinerary.budget_items.map((item) => ({
        ...item,
        splitAmong: JSON.parse(item.splitAmong),
      })),
    }))

    return NextResponse.json({ itineraries: parsedItineraries })
  } catch (error) {
    console.error('Get itineraries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    // SECURITY: Authenticate user before creating itinerary
    const auth = await authenticateUser(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to create itineraries.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateBody(createItinerarySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
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
      authorId,
      daysPlan,
      budgetItems,
      companions,
    } = validation.data

    // Convert location array to comma-separated string for database storage
    const locationString: string = Array.isArray(location) ? location.join(',') : location

    // SECURITY: Verify user can only create itineraries for their own account
    if (authorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden. You can only create itineraries for your own account.' },
        { status: 403 }
      )
    }

    const itinerary = await db.itinerary.create({
      data: {
        title,
        country,
        location: locationString,
        budget: budget || 0,
        currency: currency || 'USD',
        days: days || 1,
        travelType: travelType || 'solo',
        activities: activities ? JSON.stringify(activities) : '[]',
        isPublic: isPublic || false,
        requirements: requirements ? JSON.stringify(requirements) : null,
        authorId,
        days_plan: {
          create: (daysPlan || []).map((day: { dayNumber: number; title: string; description: string; route?: string; activities?: { title: string; description?: string; location?: string; startTime?: string; endTime?: string; cost?: number; order?: number }[] }) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            route: day.route || null,
            activities: {
              create: (day.activities || []).map((activity, index: number) => ({
                title: activity.title,
                description: activity.description || null,
                location: activity.location || null,
                startTime: activity.startTime || null,
                endTime: activity.endTime || null,
                cost: activity.cost || 0,
                order: activity.order !== undefined ? activity.order : index,
              })),
            },
          })),
        },
        budget_items: {
          create: (budgetItems || []).map((item: { name: string; amount: number; category: string; paidBy: string; splitAmong: string[] }) => ({
            name: item.name,
            amount: item.amount,
            category: item.category,
            paidBy: item.paidBy,
            splitAmong: JSON.stringify(item.splitAmong),
          })),
        },
        companions: {
          create: (companions || []).map((companion: { name: string; email?: string; userId?: string }) => ({
            name: companion.name,
            email: companion.email || null,
            userId: companion.userId || null,
          })),
        },
      },
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

    // NOTIFICATION: Send notifications to tagged companions
    if (companions && companions.length > 0) {
      const companionUserIds: string[] = []
      for (const c of companions) {
        if (c.userId) {
          companionUserIds.push(c.userId)
        }
      }

      // Create notifications for all tagged users
      for (const userId of companionUserIds) {
        try {
          await db.notification.create({
            data: {
              userId,
              type: 'itinerary_tag',
              message: `You've been tagged in a new itinerary: ${title}`,
              fromUserId: auth.userId,
            },
          })

          // Try to send push notification (non-blocking)
          try {
            await sendPushNotification({
              userId,
              title: '🗺️ You\'ve been tagged!',
              body: `${auth.email || 'Someone'} tagged you in an itinerary: ${title}`,
              type: 'itinerary_tag',
            })
          } catch (pushError) {
            console.warn('Failed to send push notification:', pushError)
          }
        } catch (notifError) {
          console.error('Failed to create notification for companion:', notifError)
        }
      }
    }

    return NextResponse.json({ itinerary: parsedItinerary }, { status: 201 })
  } catch (error) {
    console.error('Create itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    // SECURITY: Authenticate user before updating itinerary
    const auth = await authenticateUser(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to update itineraries.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateBody(updateItinerarySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { id, status, activityUpdates } = validation.data

    const existingItinerary = await db.itinerary.findUnique({
      where: { id },
    })

    if (!existingItinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    // SECURITY: Only the owner can update their itinerary
    if (existingItinerary.authorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden. You can only update your own itineraries.' },
        { status: 403 }
      )
    }

    if (status) {
      await db.itinerary.update({
        where: { id },
        data: { status },
      })
    }

    if (activityUpdates && Array.isArray(activityUpdates)) {
      for (const update of activityUpdates) {
        if (update.activityId && update.status) {
          const validActivityStatuses = ['completed', 'skipped', 'pending']
          if (validActivityStatuses.includes(update.status)) {
            await db.dayActivity.update({
              where: { id: update.activityId },
              data: { status: update.status },
            })
          }
        }
      }
    }

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
      },
    })

    const parsedItinerary = {
      ...itinerary,
      activities: JSON.parse(itinerary!.activities),
      requirements: itinerary!.requirements ? JSON.parse(itinerary!.requirements) : [],
      budget_items: itinerary!.budget_items.map((item) => ({
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
