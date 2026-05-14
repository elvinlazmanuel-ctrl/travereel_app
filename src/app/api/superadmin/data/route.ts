import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

type TableName = 'users' | 'posts' | 'communities' | 'comments' | 'reports' | 'itineraries' | 'stories' | 'messages'

const VALID_TABLES: TableName[] = ['users', 'posts', 'communities', 'comments', 'reports', 'itineraries', 'stories', 'messages']

// GET /api/superadmin/data?table=users&search=...&status=...&page=1&limit=20
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') as TableName | null
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    if (!table || !VALID_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table. Must be one of: ${VALID_TABLES.join(', ')}` },
        { status: 400 }
      )
    }

    let data: Record<string, unknown>[] = []
    let total = 0

    switch (table) {
      case 'users': {
        const where: Prisma.UserWhereInput = {}
        if (search) {
          where.OR = [
            { email: { contains: search } },
            { username: { contains: search } },
            { name: { contains: search } },
          ]
        }
        if (status === 'banned') {
          where.isBanned = true
        } else if (status === 'active') {
          where.isBanned = false
        } else if (status === 'admin') {
          where.role = 'admin'
        }

        total = await db.user.count({ where })
        data = await db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            isBanned: true,
            isPrivate: true,
            avatar: true,
            createdAt: true,
          },
        })
        break
      }

      case 'posts': {
        const where: Prisma.PostWhereInput = {}
        if (search) {
          where.OR = [
            { caption: { contains: search } },
            { location: { contains: search } },
          ]
        }
        if (status === 'flagged') {
          where.isFlagged = true
        } else if (status === 'public') {
          where.isPublic = true
        } else if (status === 'private') {
          where.isPublic = false
        }

        total = await db.post.count({ where })
        data = await db.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            caption: true,
            location: true,
            isPublic: true,
            isFlagged: true,
            images: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, username: true },
            },
          },
        })
        break
      }

      case 'communities': {
        const where: Prisma.CommunityWhereInput = {}
        if (search) {
          where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        }
        if (status) {
          where.category = status
        }

        total = await db.community.count({ where })
        data = await db.community.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            members: true,
            category: true,
            image: true,
            createdAt: true,
          },
        })
        break
      }

      case 'comments': {
        const where: Prisma.CommentWhereInput = {}
        if (search) {
          where.content = { contains: search }
        }

        total = await db.comment.count({ where })
        data = await db.comment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            likesCount: true,
            parentId: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, username: true },
            },
            post: {
              select: { id: true, caption: true },
            },
          },
        })
        break
      }

      case 'reports': {
        const where: Prisma.PostReportWhereInput = {}
        if (search) {
          where.reason = { contains: search }
        }
        if (status) {
          where.status = status
        }

        total = await db.postReport.count({ where })
        data = await db.postReport.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
            reporter: {
              select: { id: true, name: true, username: true },
            },
            post: {
              select: { id: true, caption: true, location: true },
            },
          },
        })
        break
      }

      case 'itineraries': {
        const where: Prisma.ItineraryWhereInput = {}
        if (search) {
          where.OR = [
            { title: { contains: search } },
            { country: { contains: search } },
            { location: { contains: search } },
          ]
        }
        if (status) {
          where.status = status
        }

        total = await db.itinerary.count({ where })
        data = await db.itinerary.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            country: true,
            location: true,
            budget: true,
            days: true,
            status: true,
            isPublic: true,
            travelType: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, username: true },
            },
          },
        })
        break
      }

      case 'stories': {
        const where: Prisma.StoryWhereInput = {}
        if (search) {
          where.caption = { contains: search }
        }

        total = await db.story.count({ where })
        data = await db.story.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            caption: true,
            expiresAt: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, username: true },
            },
          },
        })
        break
      }

      case 'messages': {
        const where: Prisma.MessageWhereInput = {}
        if (search) {
          where.content = { contains: search }
        }

        total = await db.message.count({ where })
        data = await db.message.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: { id: true, name: true, username: true },
            },
            chatRoom: {
              select: { id: true, name: true, isGroup: true },
            },
          },
        })
        break
      }
    }

    return NextResponse.json({
      table,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Superadmin data GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/data?table=users&id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') as TableName | null
    const id = searchParams.get('id')

    if (!table || !VALID_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table. Must be one of: ${VALID_TABLES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    switch (table) {
      case 'users':
        await db.user.delete({ where: { id } })
        break
      case 'posts':
        await db.post.delete({ where: { id } })
        break
      case 'communities':
        await db.community.delete({ where: { id } })
        break
      case 'comments':
        await db.comment.delete({ where: { id } })
        break
      case 'reports':
        await db.postReport.delete({ where: { id } })
        break
      case 'itineraries':
        await db.itinerary.delete({ where: { id } })
        break
      case 'stories':
        await db.story.delete({ where: { id } })
        break
      case 'messages':
        await db.message.delete({ where: { id } })
        break
    }

    return NextResponse.json({ success: true, message: `Record deleted from ${table}` })
  } catch (error) {
    console.error('Superadmin data DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/data - Update a record
// Body: { table, id, data }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { table, id, data: updateData } = body

    if (!table || !VALID_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table. Must be one of: ${VALID_TABLES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json(
        { error: 'Update data is required' },
        { status: 400 }
      )
    }

    let updated: Record<string, unknown> = {}

    switch (table) {
      case 'users': {
        const allowedFields = ['name', 'username', 'email', 'role', 'isBanned', 'isPrivate', 'bio', 'avatar', 'currency', 'travelType', 'language', 'notificationsEnabled', 'activityStatus', 'darkMode']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.user.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'posts': {
        const allowedFields = ['caption', 'location', 'isPublic', 'isFlagged', 'isMemory', 'tags']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.post.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'communities': {
        const allowedFields = ['name', 'description', 'image', 'members', 'category']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.community.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'comments': {
        const allowedFields = ['content', 'likesCount']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.comment.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'reports': {
        const allowedFields = ['status', 'reason']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.postReport.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'itineraries': {
        const allowedFields = ['title', 'country', 'location', 'budget', 'currency', 'days', 'travelType', 'activities', 'status', 'isPublic', 'requirements']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.itinerary.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'stories': {
        const allowedFields = ['caption', 'mediaUrl', 'mediaType', 'expiresAt']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.story.update({
          where: { id },
          data: filteredData,
        })
        break
      }

      case 'messages': {
        const allowedFields = ['content']
        const filteredData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.includes(key)) {
            filteredData[key] = value
          }
        }
        updated = await db.message.update({
          where: { id },
          data: filteredData,
        })
        break
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Superadmin data PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
