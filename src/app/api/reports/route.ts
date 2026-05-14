import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, reportPostSchema, updateReportSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const reports = await db.postReport.findMany({
      where,
      include: {
        post: {
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
        },
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group reports by postId to get report counts
    const reportCounts: Record<string, number> = {}
    const allReports = await db.postReport.findMany({
      select: { postId: true },
    })
    for (const r of allReports) {
      reportCounts[r.postId] = (reportCounts[r.postId] || 0) + 1
    }

    const reportsWithParsedPosts = reports.map((report) => ({
      ...report,
      post: report.post
        ? {
            ...report.post,
            images: JSON.parse(report.post.images),
            tags: report.post.tags ? JSON.parse(report.post.tags) : [],
            reportCount: reportCounts[report.postId] || 0,
          }
        : null,
    }))

    return NextResponse.json({ reports: reportsWithParsedPosts, reportCounts })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(updateReportSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { reportId, status } = validation.data

    const report = await db.postReport.update({
      where: { id: reportId },
      data: { status },
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(reportPostSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { postId, reporterId, reason } = validation.data

    const report = await db.postReport.create({
      data: { postId, reporterId, reason },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
