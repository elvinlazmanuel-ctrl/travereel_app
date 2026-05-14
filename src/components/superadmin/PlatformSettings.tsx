'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Palette, Mail, Phone, Globe, Settings, Loader2, Save, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsMap {
  [key: string]: string
}

export default function PlatformSettings() {
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Form state
  const [branding, setBranding] = useState({
    site_name: '',
    site_logo: '',
    site_description: '',
    primary_color: '',
    accent_color: '',
  })
  const [contact, setContact] = useState({
    contact_email: '',
    contact_phone: '',
    contact_address: '',
  })
  const [social, setSocial] = useState({
    social_twitter: '',
    social_instagram: '',
    social_facebook: '',
  })
  const [system, setSystem] = useState({
    maintenance_mode: 'false',
    registration_open: 'true',
    max_upload_size: '10',
    default_language: 'en',
  })

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/settings')
      if (res.ok) {
        const data = await res.json()
        const map = data.settingsMap || {}
        setSettingsMap(map)

        setBranding({
          site_name: map.site_name || '',
          site_logo: map.site_logo || '',
          site_description: map.site_description || '',
          primary_color: map.primary_color || '#FF6B6B',
          accent_color: map.accent_color || '#FF8C42',
        })
        setContact({
          contact_email: map.contact_email || '',
          contact_phone: map.contact_phone || '',
          contact_address: map.contact_address || '',
        })
        setSocial({
          social_twitter: map.social_twitter || '',
          social_instagram: map.social_instagram || '',
          social_facebook: map.social_facebook || '',
        })
        setSystem({
          maintenance_mode: map.maintenance_mode || 'false',
          registration_open: map.registration_open || 'true',
          max_upload_size: map.max_upload_size || '10',
          default_language: map.default_language || 'en',
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSection = async (sectionName: string, updates: Record<string, string>) => {
    setSaving(sectionName)
    try {
      const promises = Object.entries(updates).map(([key, value]) => {
        if (settingsMap[key] !== undefined) {
          // Update existing
          return fetch('/api/superadmin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          })
        } else {
          // Create new
          return fetch('/api/superadmin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          })
        }
      })

      await Promise.all(promises)
      toast.success(`${sectionName} settings saved successfully`)
      fetchSettings()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveBranding = () => saveSection('Branding', branding)
  const handleSaveContact = () => saveSection('Contact', contact)
  const handleSaveSocial = () => saveSection('Social', social)
  const handleSaveSystem = () => saveSection('System', system)

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" style={{ color: '#FF6B6B' }} />
              <CardTitle className="text-base">Branding</CardTitle>
            </div>
            <CardDescription>Customize your platform&apos;s appearance and identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={branding.site_name}
                  onChange={(e) => setBranding({ ...branding, site_name: e.target.value })}
                  placeholder="Travereel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_logo">Site Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="site_logo"
                    value={branding.site_logo}
                    onChange={(e) => setBranding({ ...branding, site_logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  {branding.site_logo && (
                    <div className="w-9 h-9 rounded-md border border-border overflow-hidden shrink-0">
                      <img
                        src={branding.site_logo}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  {!branding.site_logo && (
                    <div className="w-9 h-9 rounded-md border border-border flex items-center justify-center shrink-0 bg-muted">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea
                id="site_description"
                value={branding.site_description}
                onChange={(e) => setBranding({ ...branding, site_description: e.target.value })}
                placeholder="Share your travel adventures..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={branding.primary_color || '#FF6B6B'}
                      onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer"
                    />
                  </div>
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    placeholder="#FF6B6B"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent_color">Accent Color</Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={branding.accent_color || '#FF8C42'}
                      onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer"
                    />
                  </div>
                  <Input
                    value={branding.accent_color}
                    onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                    placeholder="#FF8C42"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleSaveBranding}
              disabled={saving === 'Branding'}
              size="sm"
              className="text-white"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              {saving === 'Branding' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Branding
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" style={{ color: '#FF8C42' }} />
              <CardTitle className="text-base">Contact Information</CardTitle>
            </div>
            <CardDescription>How users can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contact.contact_email}
                  onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                  placeholder="hello@travereel.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                </Label>
                <Input
                  id="contact_phone"
                  value={contact.contact_phone}
                  onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address">Address</Label>
              <Input
                id="contact_address"
                value={contact.contact_address}
                onChange={(e) => setContact({ ...contact, contact_address: e.target.value })}
                placeholder="123 Travel St, Adventure City"
              />
            </div>
            <Button
              onClick={handleSaveContact}
              disabled={saving === 'Contact'}
              size="sm"
              className="text-white"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              {saving === 'Contact' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Contact
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Social */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#2EC4B6' }} />
              <CardTitle className="text-base">Social Links</CardTitle>
            </div>
            <CardDescription>Your social media presence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social_twitter">Twitter</Label>
                <Input
                  id="social_twitter"
                  value={social.social_twitter}
                  onChange={(e) => setSocial({ ...social, social_twitter: e.target.value })}
                  placeholder="@travereel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_instagram">Instagram</Label>
                <Input
                  id="social_instagram"
                  value={social.social_instagram}
                  onChange={(e) => setSocial({ ...social, social_instagram: e.target.value })}
                  placeholder="@travereel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_facebook">Facebook</Label>
                <Input
                  id="social_facebook"
                  value={social.social_facebook}
                  onChange={(e) => setSocial({ ...social, social_facebook: e.target.value })}
                  placeholder="travereel"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveSocial}
              disabled={saving === 'Social'}
              size="sm"
              className="text-white"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              {saving === 'Social' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Social
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* System */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: '#8338EC' }} />
              <CardTitle className="text-base">System Settings</CardTitle>
            </div>
            <CardDescription>Core platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Temporarily disable access</p>
                </div>
                <Switch
                  checked={system.maintenance_mode === 'true'}
                  onCheckedChange={(checked) => setSystem({ ...system, maintenance_mode: checked ? 'true' : 'false' })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Registration Open</Label>
                  <p className="text-xs text-muted-foreground">Allow new user signups</p>
                </div>
                <Switch
                  checked={system.registration_open === 'true'}
                  onCheckedChange={(checked) => setSystem({ ...system, registration_open: checked ? 'true' : 'false' })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_upload_size">Max Upload Size (MB)</Label>
                <Input
                  id="max_upload_size"
                  type="number"
                  value={system.max_upload_size}
                  onChange={(e) => setSystem({ ...system, max_upload_size: e.target.value })}
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_language">Default Language</Label>
                <Select
                  value={system.default_language}
                  onValueChange={(v) => setSystem({ ...system, default_language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSaveSystem}
              disabled={saving === 'System'}
              size="sm"
              className="text-white"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              {saving === 'System' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save System
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
