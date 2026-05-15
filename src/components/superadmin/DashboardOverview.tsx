'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  FileText,
  Globe,
  AlertTriangle,
  Map,
  TrendingUp,
  MessageSquare,
  Image,
} from 'lucide-react'

interface StatsData {
  overview: {
    totalUsers: number
    totalPosts: number
    totalCommunities: number
    totalReports: number
    totalItineraries: number
    totalComments: number
    totalStories: number
    totalMessages: number
    newUsersThisWeek: number
    newPostsThisWeek: number
    bannedUsers: number
    flaggedPosts: number
  }
  reportsBreakdown: Record<string, number>
  recentActivity: Array<{
    id: string
    action: string
    targetType: string
    targetId: string
    details: string | null
    createdAt: string
    admin: { id: string; name: string; username: string; avatar: string | null }
  }>
}

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: '#FF6B6B' },
  { key: 'totalPosts', label: 'Total Posts', icon: FileText, color: '#FF8C42' },
  { key: 'totalCommunities', label: 'Communities', icon: Globe, color: '#2EC4B6' },
  { key: 'totalReports', label: 'Pending Reports', icon: AlertTriangle, color: '#E9C46A' },
  { key: 'totalItineraries', label: 'Itineraries', icon: Map, color: '#8338EC' },
  { key: 'newUsersThisWeek', label: 'New This Week', icon: TrendingUp, color: '#06D6A0' },
]

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const value = stats?.overview[card.key as keyof StatsData['overview']] ?? 0
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {formatNumber(value)}
                        </span>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: card.color + '20' }}
                        >
                          <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {card.label}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-foreground">{(stats?.overview.totalUsers ?? 0) - (stats?.overview.bannedUsers ?? 0)} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-foreground">{stats?.overview.bannedUsers ?? 0} Banned</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Post Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-foreground">{(stats?.overview.totalPosts ?? 0) - (stats?.overview.flaggedPosts ?? 0)} Clean</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E9C46A' }} />
                  <span className="text-sm text-foreground">{stats?.overview.flaggedPosts ?? 0} Flagged</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400">
                  {stats?.reportsBreakdown.pending ?? 0} Pending
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
                  {stats?.reportsBreakdown.reviewed ?? 0} Reviewed
                </Badge>
                <Badge variant="outline" className="text-foreground border-gray-300 bg-gray-50 dark:bg-gray-950/30 dark:border-gray-700 dark:text-gray-400">
                  {stats?.reportsBreakdown.dismissed ?? 0} Dismissed
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Comments', value: stats?.overview.totalComments, icon: MessageSquare, color: '#FF8C42' },
          { label: 'Stories', value: stats?.overview.totalStories, icon: Image, color: '#8338EC' },
          { label: 'Messages', value: stats?.overview.totalMessages, icon: MessageSquare, color: '#2EC4B6' },
          { label: 'New Posts This Week', value: stats?.overview.newPostsThisWeek, icon: TrendingUp, color: '#06D6A0' },
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.color + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-5 w-10 mb-1" />
                  ) : (
                    <p className="text-lg font-bold text-foreground">{formatNumber(item.value ?? 0)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-medium"
                          style={{
                            borderColor: '#FF6B6B40',
                            color: '#FF6B6B',
                            backgroundColor: '#FF6B6B10',
                          }}
                        >
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {activity.targetType}
                          {activity.targetId ? ` #${activity.targetId.slice(0, 8)}` : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {activity.admin?.name || activity.admin?.username || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent admin activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
