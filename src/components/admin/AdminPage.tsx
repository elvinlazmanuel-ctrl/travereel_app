'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  FileText,
  Flag,
  BarChart3,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Server,
  Database,
  MessageCircle,
  Heart,
  Ban,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  totalPosts: number
  totalCommunities: number
  totalItineraries: number
  totalComments: number
  totalLikes: number
  totalReports: number
}

interface AdminAction {
  id: string
  action: string
  targetType: string
  targetId: string
  details: string | null
  createdAt: string
  admin: {
    id: string
    username: string
    name: string
    avatar: string | null
  }
}

interface DbStats {
  users: number
  posts: number
  communities: number
  itineraries: number
  comments: number
  likes: number
  reports: number
  sharedPosts: number
}

function getActionIcon(action: string, targetType: string) {
  if (action.includes('ban')) return Ban
  if (action.includes('delete')) return AlertTriangle
  if (action.includes('flag')) return Flag
  if (targetType === 'user') return Users
  if (targetType === 'post') return FileText
  if (targetType === 'community') return Shield
  return Activity
}

function getActionColor(action: string) {
  if (action.includes('ban') || action.includes('delete')) return 'text-red-500 bg-red-50'
  if (action.includes('flag')) return 'text-amber-500 bg-amber-50'
  if (action.includes('role')) return 'text-purple-500 bg-purple-50'
  return 'text-gray-500 bg-gray-50'
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminPage() {
  const { currentUser, setCurrentView } = useAppStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActions, setRecentActions] = useState<AdminAction[]>([])
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentUser?.role !== 'admin') return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin?requestingUserId=${currentUser!.id}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
          setRecentActions(data.recentActions || [])
          setDbStats(data.dbStats)
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
        toast.error('Failed to load admin data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser?.role])

  // Auth guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 mb-4">You don&apos;t have permission to access the admin dashboard.</p>
        <Button
          onClick={() => setCurrentView('settings')}
          className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white"
        >
          Go to Settings
        </Button>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-[#FF6B6B] to-[#FF8C42]', view: 'admin-users' as const },
    { label: 'Total Posts', value: stats?.totalPosts || 0, icon: FileText, color: 'from-[#2EC4B6] to-[#2EC4B6]/70', view: 'admin-posts' as const },
    { label: 'Communities', value: stats?.totalCommunities || 0, icon: Shield, color: 'from-[#FFBA49] to-[#FFBA49]/70', view: 'admin-communities' as const },
    { label: 'Itineraries', value: stats?.totalItineraries || 0, icon: TrendingUp, color: 'from-[#6C5CE7] to-[#6C5CE7]/70', view: 'admin' as const },
  ]

  const quickActions = [
    { label: 'Manage Users', description: 'View and manage user accounts', icon: Users, view: 'admin-users' as const },
    { label: 'Manage Communities', description: 'Moderate communities', icon: Shield, view: 'admin-communities' as const },
    { label: 'Manage Posts', description: 'Review and moderate posts', icon: FileText, view: 'admin-posts' as const },
    { label: 'View Reports', description: `Handle user reports${stats?.totalReports ? ` (${stats.totalReports})` : ''}`, icon: Flag, view: 'admin-posts' as const },
  ]

  const dbStatItems = dbStats ? [
    { label: 'Users', count: dbStats.users, icon: Users, color: '#FF6B6B' },
    { label: 'Posts', count: dbStats.posts, icon: FileText, color: '#2EC4B6' },
    { label: 'Communities', count: dbStats.communities, icon: Shield, color: '#FFBA49' },
    { label: 'Itineraries', count: dbStats.itineraries, icon: TrendingUp, color: '#6C5CE7' },
    { label: 'Comments', count: dbStats.comments, icon: MessageCircle, color: '#FF8C42' },
    { label: 'Likes', count: dbStats.likes, icon: Heart, color: '#FF6B6B' },
    { label: 'Reports', count: dbStats.reports, icon: Flag, color: '#E74C3C' },
    { label: 'Shared Posts', count: dbStats.sharedPosts, icon: Server, color: '#3498DB' },
  ] : []

  const maxDbCount = Math.max(...dbStatItems.map((s) => s.count), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('settings')}
          className="size-9"
        >
          <ArrowLeft className="size-5 text-gray-700" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] flex items-center justify-center">
            <Shield className="size-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
              onClick={() => setCurrentView(stat.view)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`size-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="size-4 text-white" />
                  </div>
                  <BarChart3 className="size-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
                onClick={() => setCurrentView(action.view)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <action.icon className="size-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="size-5 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-400 ml-2">Loading...</span>
              </div>
            ) : recentActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock className="size-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No recent admin activity</p>
              </div>
            ) : (
              recentActions.map((item, index) => {
                const Icon = getActionIcon(item.action, item.targetType)
                const colorClass = getActionColor(item.action)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      index < recentActions.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        <span className="font-medium">@{item.admin.username}</span> {item.action} {item.targetType}
                      </p>
                      {item.details && (
                        <p className="text-xs text-gray-400 truncate">{item.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="size-3 text-gray-400" />
                      <span className="text-[11px] text-gray-400">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Health */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Database Statistics</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Database className="size-5 text-gray-400 animate-pulse mr-2" />
                <span className="text-sm text-gray-400">Loading stats...</span>
              </div>
            ) : (
              dbStatItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                      <item.icon className="size-3.5" style={{ color: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max((item.count / maxDbCount) * 100, 2)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            <div className="pt-2 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Database Online</span>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] ml-auto">
                Healthy
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
