'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, ToggleLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Feature {
  id: string
  key: string
  label: string
  description: string | null
  category: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

const categoryIcons: Record<string, string> = {
  content: '📝',
  moderation: '🛡️',
  features: '✨',
  access: '🔐',
  community: '👥',
  general: '⚙️',
}

const categoryOrder = ['content', 'moderation', 'features', 'access', 'community', 'general']

const categoryLabels: Record<string, string> = {
  content: 'Content',
  moderation: 'Moderation',
  features: 'Features',
  access: 'Access',
  community: 'Community',
  general: 'General',
}

export default function FeatureToggles() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [grouped, setGrouped] = useState<Record<string, Feature[]>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newFeature, setNewFeature] = useState({
    key: '',
    label: '',
    description: '',
    category: 'general',
    enabled: true,
  })
  const [creating, setCreating] = useState(false)

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/features')
      if (res.ok) {
        const data = await res.json()
        setFeatures(data.features || [])
        setGrouped(data.grouped || {})
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch features:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  const handleToggle = async (key: string, enabled: boolean) => {
    setTogglingKey(key)
    // Optimistic update
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled } : f))
    )
    setGrouped((prev) => {
      const updated = { ...prev }
      for (const cat of Object.keys(updated)) {
        updated[cat] = updated[cat].map((f) =>
          f.key === key ? { ...f, enabled } : f
        )
      }
      return updated
    })

    try {
      const res = await fetch('/api/superadmin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })
      if (res.ok) {
        toast.success(`Feature "${key}" ${enabled ? 'enabled' : 'disabled'}`)
      } else {
        // Revert on error
        const data = await res.json()
        toast.error(data.error || 'Failed to toggle feature')
        fetchFeatures()
      }
    } catch {
      toast.error('Network error')
      fetchFeatures()
    } finally {
      setTogglingKey(null)
    }
  }

  const handleCreate = async () => {
    if (!newFeature.key || !newFeature.label) {
      toast.error('Key and label are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/superadmin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeature),
      })
      if (res.ok) {
        toast.success('Feature created successfully')
        setDialogOpen(false)
        setNewFeature({ key: '', label: '', description: '', category: 'general', enabled: true })
        fetchFeatures()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create feature')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setCreating(false)
    }
  }

  const sortedCategories = [...categories].sort((a, b) => {
    const ai = categoryOrder.indexOf(a)
    const bi = categoryOrder.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Feature Toggles</h2>
          <p className="text-sm text-muted-foreground">{features.length} features configured</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-white" style={{ backgroundColor: '#FF6B6B' }}>
              <Plus className="w-4 h-4 mr-1" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feature Toggle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="feat-key">Key</Label>
                <Input
                  id="feat-key"
                  placeholder="e.g., new_dashboard"
                  value={newFeature.key}
                  onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feat-label">Label</Label>
                <Input
                  id="feat-label"
                  placeholder="e.g., New Dashboard"
                  value={newFeature.label}
                  onChange={(e) => setNewFeature({ ...newFeature, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feat-desc">Description</Label>
                <Input
                  id="feat-desc"
                  placeholder="Optional description"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newFeature.category}
                  onValueChange={(v) => setNewFeature({ ...newFeature, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['content', 'moderation', 'features', 'access', 'community', 'general'].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newFeature.enabled}
                  onCheckedChange={(v) => setNewFeature({ ...newFeature, enabled: v })}
                />
                <Label>Enabled by default</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={creating}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={creating} style={{ backgroundColor: '#FF6B6B' }} className="text-white">
                {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {sortedCategories.map((category) => {
            const categoryFeatures = grouped[category] || []
            if (categoryFeatures.length === 0) return null

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span>{categoryIcons[category] || '⚙️'}</span>
                      <span>{categoryLabels[category] || category}</span>
                      <span className="text-muted-foreground font-normal">
                        ({categoryFeatures.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {categoryFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className={`
                          flex items-center justify-between gap-4 p-3 rounded-lg transition-colors
                          ${feature.enabled ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-muted/30'}
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium text-foreground">
                              {feature.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {feature.key}
                            </span>
                          </div>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                          disabled={togglingKey === feature.key}
                          className={feature.enabled ? 'data-[state=checked]:bg-green-500' : ''}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}

      {!loading && features.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ToggleLeft className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No feature toggles configured</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Click &quot;Add Feature&quot; to create one</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
