import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/superadmin/stats - Fetch dashboard overview stats
export async function GET() {
  try {
    // Get total counts
    const [
      totalUsers,
      totalPosts,
      totalCommunities,
      totalReports,
      totalItineraries,
      totalComments,
      totalStories,
      totalMessages,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.community.count(),
      db.postReport.count({ where: { status: 'pending' } }),
      db.itinerary.count(),
      db.comment.count(),
      db.story.count(),
      db.message.count(),
    ])

    // Get counts for this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [
      newUsersThisWeek,
      newPostsThisWeek,
      bannedUsers,
      flaggedPosts,
      reportsByStatus,
    ] = await Promise.all([
      db.user.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      db.post.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      db.user.count({ where: { isBanned: true } }),
      db.post.count({ where: { isFlagged: true } }),
      db.postReport.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    // Get recent admin actions (last 10)
    const recentActivity = await db.adminAction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    })

    // Format reports by status
    const reportsBreakdown: Record<string, number> = {}
    for (const report of reportsByStatus) {
      reportsBreakdown[report.status] = report._count.status
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPosts,
        totalCommunities,
        totalReports,
        totalItineraries,
        totalComments,
        totalStories,
        totalMessages,
        newUsersThisWeek,
        newPostsThisWeek,
        bannedUsers,
        flaggedPosts,
      },
      reportsBreakdown,
      recentActivity,
    })
  } catch (error) {
    console.error('Superadmin stats GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
