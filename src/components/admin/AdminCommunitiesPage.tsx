'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Trash2,
  Star,
  Edit3,
  Plus,
  Users,
  Shield,
  Loader2,
  MoreHorizontal,
  Globe,
  Save,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore, type CommunityType } from '@/lib/store'
import CreateCommunityDialog from '@/components/community/CreateCommunityDialog'
import { toast } from 'sonner'

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'travel-style', label: 'Travel Style' },
  { value: 'budget', label: 'Budget' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'food', label: 'Food' },
  { value: 'photography', label: 'Photography' },
  { value: 'remote-work', label: 'Remote Work' },
]

export default function AdminCommunitiesPage() {
  const { currentUser, setCurrentView, communities, setCommunities } = useAppStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filteredCommunities, setFilteredCommunities] = useState<CommunityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({ open: false, title: '', description: '', action: () => {} })

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    community: CommunityType | null
  }>({ open: false, community: null })
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editImage, setEditImage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const logAdminAction = async (action: string, targetType: string, targetId: string, details?: string) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser!.id,
          action,
          targetType,
          targetId,
          details: details || null,
        }),
      })
    } catch {
      // Silent fail for logging
    }
  }

  const fetchCommunities = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/communities${categoryFilter !== 'all' ? `?category=${categoryFilter}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setCommunities(data.communities || [])
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err)
      toast.error('Failed to load communities')
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, setCommunities])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  useEffect(() => {
    let filtered = communities
    if (search) {
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(search.toLowerCase())
      )
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter)
    }
    setFilteredCommunities(filtered)
  }, [communities, search, categoryFilter])

  const handleDelete = (community: CommunityType) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Community',
      description: `Are you sure you want to delete "${community.name}"? This action cannot be undone.`,
      action: async () => {
        try {
          const res = await fetch('/api/communities', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communityId: community.id, requestingUserId: currentUser!.id }),
          })
          if (res.ok) {
            setCommunities(communities.filter((c) => c.id !== community.id))
            toast.success('Community deleted')
            logAdminAction('deleted', 'community', community.id, community.name)
          } else {
            toast.error('Failed to delete community')
          }
        } catch {
          toast.error('Failed to delete community')
        }
      },
    })
  }

  const handleFeature = async (community: CommunityType) => {
    try {
      const res = await fetch('/api/communities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: community.id, isFeatured: true, requestingUserId: currentUser!.id }),
      })
      if (res.ok) {
        toast.success(`Community "${community.name}" featured!`)
        logAdminAction('featured', 'community', community.id, community.name)
      } else {
        toast.error('Failed to feature community')
      }
    } catch {
      toast.error('Failed to feature community')
    }
  }

  const handleEditOpen = (community: CommunityType) => {
    setEditName(community.name)
    setEditDescription(community.description || '')
    setEditCategory(community.category || '')
    setEditImage(community.image || '')
    setEditDialog({ open: true, community })
  }

  const handleEditSave = async () => {
    if (!editDialog.community) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/communities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: editDialog.community.id,
          name: editName,
          description: editDescription,
          category: editCategory,
          image: editImage,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCommunities(
          communities.map((c) =>
            c.id === editDialog.community!.id
              ? { ...c, name: editName, description: editDescription, category: editCategory, image: editImage }
              : c
          )
        )
        toast.success('Community updated')
        logAdminAction('edited', 'community', editDialog.community.id, editName)
        setEditDialog({ open: false, community: null })
      } else {
        toast.error('Failed to update community')
      }
    } catch {
      toast.error('Failed to update community')
    } finally {
      setIsSaving(false)
    }
  }

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null
    const colors: Record<string, string> = {
      'travel-style': 'bg-blue-50 text-blue-600 border-blue-200',
      'budget': 'bg-green-50 text-green-600 border-green-200',
      'adventure': 'bg-orange-50 text-orange-600 border-orange-200',
      'food': 'bg-red-50 text-red-600 border-red-200',
      'photography': 'bg-purple-50 text-purple-600 border-purple-200',
      'remote-work': 'bg-gray-50 text-gray-600 border-gray-200',
    }
    return (
      <Badge variant="outline" className={`text-[10px] ${colors[category] || ''}`}>
        {categories.find((c) => c.value === category)?.label || category}
      </Badge>
    )
  }

  // Auth guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Shield className="size-12 text-red-300 mx-auto mb-3" />
        <p className="text-muted-foreground">Access denied</p>
        <Button variant="ghost" onClick={() => setCurrentView('settings')} className="mt-3">
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView('admin')}
            className="size-9"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">Community Management</h1>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#2EC4B6]/80 text-white text-xs"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="size-3.5 mr-1" />
          Create
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="pl-9 h-10 rounded-xl border-gray-200"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl border-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-3">{filteredCommunities.length} communities found</p>

      {/* Community List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="size-12 text-gray-300 mb-3" />
          <p className="text-sm text-muted-foreground">No communities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12 rounded-lg">
                        <AvatarImage src={community.image || undefined} alt={community.name} />
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#2EC4B6]/20 to-[#2EC4B6]/10 text-[#2EC4B6]">
                          {community.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{community.name}</span>
                          {getCategoryBadge(community.category)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{community.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="size-3 text-gray-400" />
                          <span className="text-[11px] text-gray-400">{community.members} members</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleFeature(community)}>
                            <Star className="size-4 mr-2" />
                            Feature Community
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOpen(community)}>
                            <Edit3 className="size-4 mr-2" />
                            Edit Community
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(community)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete Community
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Community Dialog */}
      <CreateCommunityDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Edit Community Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Community name"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Community description"
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.value !== 'all').map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Image URL</label>
              <Input
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ ...editDialog, open: false })} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving} className="rounded-xl bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                confirmDialog.action()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
