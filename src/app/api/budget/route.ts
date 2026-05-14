import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createBudgetItemSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const itineraryId = searchParams.get('itineraryId')

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Itinerary ID query parameter is required' },
        { status: 400 }
      )
    }

    const budgetItems = await db.budgetItem.findMany({
      where: { itineraryId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const parsedBudgetItems = budgetItems.map((item) => ({
      ...item,
      splitAmong: JSON.parse(item.splitAmong),
    }))

    const totalAmount = parsedBudgetItems.reduce((sum, item) => sum + item.amount, 0)

    return NextResponse.json({
      budgetItems: parsedBudgetItems,
      total: totalAmount,
    })
  } catch (error) {
    console.error('Get budget items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(createBudgetItemSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { name, amount, category, paidBy, splitAmong, itineraryId, userId } = validation.data

    const itinerary = await db.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    // Verify ownership - only the trip organizer can add budget items
    if (userId && itinerary.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the trip organizer can add expenses' },
        { status: 403 }
      )
    }

    const budgetItem = await db.budgetItem.create({
      data: {
        name,
        amount: parseFloat(String(amount)),
        category,
        paidBy,
        splitAmong: JSON.stringify(splitAmong || []),
        itineraryId,
      },
    })

    const parsedBudgetItem = {
      ...budgetItem,
      splitAmong: JSON.parse(budgetItem.splitAmong),
    }

    return NextResponse.json({ budgetItem: parsedBudgetItem }, { status: 201 })
  } catch (error) {
    console.error('Create budget item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id) {
      return NextResponse.json({ error: 'Budget item ID is required' }, { status: 400 })
    }

    // Find the budget item and its itinerary
    const budgetItem = await db.budgetItem.findUnique({
      where: { id },
      include: { itinerary: { select: { authorId: true } } },
    })

    if (!budgetItem) {
      return NextResponse.json({ error: 'Budget item not found' }, { status: 404 })
    }

    // Verify ownership
    if (userId && budgetItem.itinerary.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the trip organizer can delete expenses' },
        { status: 403 }
      )
    }

    await db.budgetItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete budget item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
