'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Lock,
  Mail,
  Moon,
  Bell,
  Globe,
  Eye,
  Activity,
  Wallet,
  Compass,
  Info,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Camera,
  Save,
  Loader2,
  X,
  Upload,
  MapPin,
  Trash2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { detectUserLocation, getStoredLocation, storeDetectedLocation, getCurrencyForCountry } from '@/lib/user-location'
import { PushNotificationSettings } from './PushNotificationSettings'
import BlockedUsersManagement from './BlockedUsersManagement'
import AccountDeletion from './AccountDeletion'

interface SettingRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  rightElement?: React.ReactNode
  onClick?: () => void
}

function SettingRow({ icon, label, value, rightElement, onClick }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-4 hover:bg-muted transition-colors text-left"
    >
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {value && <p className="text-xs text-muted-foreground truncate">{value}</p>}
      </div>
      {rightElement || (
        <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  )
}

interface SettingToggleProps {
  icon: React.ReactNode
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function SettingToggle({ icon, label, description, checked, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

interface SectionHeaderProps {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
    </div>
  )
}

export default function SettingsPage() {
  const { currentUser, logout, setCurrentView, updateCurrentUser } = useAppStore()
  const { theme, setTheme } = useTheme()

  // Settings state - initialize from currentUser
  const [darkMode, setDarkMode] = useState(currentUser?.darkMode || false)
  const [notifications, setNotifications] = useState(currentUser?.notificationsEnabled !== false)
  const [privateAccount, setPrivateAccount] = useState(currentUser?.isPrivate || false)
  const [activityStatus, setActivityStatus] = useState(currentUser?.activityStatus !== false)
  const [language, setLanguage] = useState(currentUser?.language || 'en')
  const [defaultCurrency, setDefaultCurrency] = useState(currentUser?.currency || 'USD')
  const [defaultTravelType, setDefaultTravelType] = useState(currentUser?.travelType || 'solo')
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false)
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false)

  // Edit profile form
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Change email form
  const [newEmail, setNewEmail] = useState('')

  // Loading states
  const [isSaving, setIsSaving] = useState(false)

  // File input ref
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Apply dark mode on mount and when changed
  useEffect(() => {
    // Sync with next-themes - only update if different
    const currentTheme = theme === 'dark'
    if (darkMode !== currentTheme) {
      setTheme(darkMode ? 'dark' : 'light')
    }
  }, [darkMode])

  // Sync from next-themes on mount only
  useEffect(() => {
    const isDark = theme === 'dark'
    // Only sync once on mount to avoid infinite loop
    if (currentUser && isDark !== darkMode) {
      setDarkMode(isDark)
    }
  }, []) // Empty dependency array - only runs on mount

  // Detect user location on mount to suggest currency
  useEffect(() => {
    const detectLocation = async () => {
      // Check if user already has a currency set
      if (currentUser?.currency) return

      // Check stored location
      const stored = getStoredLocation()
      if (stored) {
        setDetectedCountry(stored.country)
        // Auto-set currency if not already set
        if (!currentUser?.currency && stored.currency !== 'USD') {
          setDefaultCurrency(stored.currency)
          saveSetting('currency', stored.currency)
        }
        return
      }

      // Detect location from IP
      setIsDetectingLocation(true)
      try {
        const location = await detectUserLocation()
        if (location && location.country !== 'Unknown') {
          setDetectedCountry(location.country)
          storeDetectedLocation(location)
          
          // Auto-set currency based on detected location
          if (!currentUser?.currency && location.currency !== 'USD') {
            setDefaultCurrency(location.currency)
            saveSetting('currency', location.currency)
            toast.success(`Detected your location! Default currency set to ${location.currency}`)
          }
        }
      } catch (error) {
        console.warn('Location detection failed:', error)
      } finally {
        setIsDetectingLocation(false)
      }
    }

    detectLocation()
  }, [currentUser])

  // Initialize edit forms when dialogs open
  useEffect(() => {
    if (editProfileOpen) {
      setEditName(currentUser?.name || '')
      setEditBio(currentUser?.bio || '')
      setEditAvatar(currentUser?.avatar || '')
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [editProfileOpen, currentUser])

  useEffect(() => {
    if (changeEmailOpen) {
      setNewEmail(currentUser?.email || '')
    }
  }, [changeEmailOpen, currentUser])

  const saveSetting = async (field: string, value: unknown) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser!.id, [field]: value }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          updateCurrentUser(data.settings)
        }
        toast.success('Settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    setTheme(checked ? 'dark' : 'light')
    saveSetting('darkMode', checked)
  }

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked)
    saveSetting('notificationsEnabled', checked)
  }

  const handlePrivateAccountChange = (checked: boolean) => {
    setPrivateAccount(checked)
    saveSetting('isPrivate', checked)
  }

  const handleActivityStatusChange = (checked: boolean) => {
    setActivityStatus(checked)
    saveSetting('activityStatus', checked)
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    saveSetting('language', value)
  }

  const handleCurrencyChange = (value: string) => {
    setDefaultCurrency(value)
    saveSetting('currency', value)
  }

  const handleTravelTypeChange = (value: string) => {
    setDefaultTravelType(value)
    saveSetting('travelType', value)
  }

  // Upload avatar image
  const uploadAvatarImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', currentUser!.id)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    throw new Error('Avatar upload failed')
  }

  // Handle avatar file selection
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }

    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // Remove avatar preview
  const handleRemoveAvatarPreview = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
    setEditAvatar('')
  }

  // Handle profile picture upload directly from the main settings page
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }

    try {
      const url = await uploadAvatarImage(file)
      // Save the new avatar URL
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser!.id,
          avatar: url,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        updateCurrentUser(data.settings)
        toast.success('Profile picture updated!')
      } else {
        toast.error('Failed to update profile picture')
      }
    } catch {
      toast.error('Failed to upload profile picture')
    }

    e.target.value = ''
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      let avatarUrl = editAvatar

      // Upload new avatar if a file was selected
      if (avatarFile) {
        setIsUploadingAvatar(true)
        avatarUrl = await uploadAvatarImage(avatarFile)
        setIsUploadingAvatar(false)
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser!.id,
          name: editName,
          bio: editBio,
          avatar: avatarUrl || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        updateCurrentUser(data.settings)
        toast.success('Profile updated')
        if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        setAvatarFile(null)
        setAvatarPreview(null)
        setEditProfileOpen(false)
      } else {
        toast.error('Failed to update profile')
      }
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
      setIsUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser!.id,
          currentPassword,
          newPassword,
        }),
      })
      if (res.ok) {
        toast.success('Password changed')
        setChangePasswordOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to change password')
      }
    } catch {
      toast.error('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser!.id,
          email: newEmail,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        updateCurrentUser(data.settings)
        toast.success('Email updated')
        setChangeEmailOpen(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update email')
      }
    } catch {
      toast.error('Failed to update email')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarUrl = currentUser?.avatar || `https://picsum.photos/seed/${currentUser?.id}/200/200`
  const name = currentUser?.name || 'Traveler'
  const email = currentUser?.email || 'traveler@travereel.com'
  const username = currentUser?.username || 'traveler'

  const languageLabels: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
  }

  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'PHP', 'CAD', 'AUD', 'KRW', 'CNY', 'INR']
  const travelTypeOptions = [
    { value: 'solo', label: 'Solo' },
    { value: 'couple', label: 'Couple' },
    { value: 'family', label: 'Family' },
    { value: 'group', label: 'Group' },
    { value: 'business', label: 'Business' },
  ]

  return (
    <div className="max-w-md mx-auto">
      {/* Profile Section */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16 border-2 border-[#2F5C9B]/20">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B]/20 to-[#5CA5CD]/20 text-lg font-bold text-[#2F5C9B]">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-[#5CA5CD] flex items-center justify-center border-2 border-card cursor-pointer hover:bg-[#5CA5CD]/80 transition-colors"
              aria-label="Change profile picture"
            >
              <Camera className="size-3 text-white" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleProfilePictureUpload}
              className="hidden"
              aria-label="Upload profile picture"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">@{username}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-lg border-border hover:border-[#5CA5CD] hover:text-[#5CA5CD]"
            onClick={() => setEditProfileOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      <Separator />

      {/* Account Settings */}
      <SectionHeader title="Account" />
      <SettingRow
        icon={<Lock className="size-4" />}
        label="Change Password"
        value="Last changed recently"
        onClick={() => setChangePasswordOpen(true)}
      />
      <SettingRow
        icon={<Mail className="size-4" />}
        label="Change Email"
        value={email}
        onClick={() => setChangeEmailOpen(true)}
      />

      <Separator />

      {/* Preferences */}
      <SectionHeader title="Preferences" />
      <SettingToggle
        icon={<Moon className="size-4" />}
        label="Dark Mode"
        description="Use dark theme"
        checked={darkMode}
        onCheckedChange={handleDarkModeChange}
      />
      <SettingToggle
        icon={<Bell className="size-4" />}
        label="Notifications"
        description="Receive push notifications"
        checked={notifications}
        onCheckedChange={handleNotificationsChange}
      />
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
          <Globe className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">Language</p>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
            <SelectItem value="ko">한국어</SelectItem>
            <SelectItem value="zh">中文</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Privacy */}
      <SectionHeader title="Privacy" />
      <SettingToggle
        icon={<Eye className="size-4" />}
        label="Private Account"
        description="Only approved followers can see your posts"
        checked={privateAccount}
        onCheckedChange={handlePrivateAccountChange}
      />
      <SettingToggle
        icon={<Activity className="size-4" />}
        label="Activity Status"
        description="Show when you're active"
        checked={activityStatus}
        onCheckedChange={handleActivityStatusChange}
      />
      <SettingRow
        icon={<Shield className="size-4" />}
        label="Blocked Users"
        value="Manage users you've blocked"
        onClick={() => setBlockedUsersOpen(true)}
      />

      <Separator />

      {/* Push Notifications */}
      <PushNotificationSettings />

      <Separator />

      {/* Travel Preferences */}
      <SectionHeader title="Travel Preferences" />
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
          <Wallet className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">Default Currency</p>
          {detectedCountry && (
            <p className="text-xs text-[#5CA5CD] flex items-center gap-1">
              <MapPin className="size-2.5" />
              Detected from {detectedCountry}
            </p>
          )}
        </div>
        <Select value={defaultCurrency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-[90px] h-8 text-xs rounded-lg border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
          <Compass className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">Default Travel Type</p>
        </div>
        <Select value={defaultTravelType} onValueChange={handleTravelTypeChange}>
          <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {travelTypeOptions.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* About */}
      <SectionHeader title="About" />
      <SettingRow
        icon={<Info className="size-4" />}
        label="Version"
        value="1.0.0"
      />
      <SettingRow
        icon={<FileText className="size-4" />}
        label="Terms of Service"
        onClick={() => setTermsOpen(true)}
      />
      <SettingRow
        icon={<Shield className="size-4" />}
        label="Privacy Policy"
        onClick={() => setPrivacyOpen(true)}
      />

      <Separator />

      {/* Danger Zone */}
      <SectionHeader title="Account" />
      <SettingRow
        icon={<Trash2 className="size-4" />}
        label="Delete Account"
        value="Permanently delete your account"
        onClick={() => setAccountDeletionOpen(true)}
      />

      <Separator />

      {/* Admin Section - Only for admins */}
      {currentUser?.role === 'admin' && (
        <>
          <SectionHeader title="Admin" />
          <SettingRow
            icon={<Shield className="size-4" />}
            label="Admin Dashboard"
            value="Manage platform"
            onClick={() => setCurrentView('admin')}
          />
          <Separator />
        </>
      )}

      {/* Log Out */}
      <div className="px-4 py-4">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full h-11 text-[#2F5C9B] border-[#2F5C9B]/30 hover:bg-[#2F5C9B]/10 hover:text-[#2F5C9B] hover:border-[#2F5C9B]/50 rounded-xl text-sm font-medium"
            onClick={logout}
          >
            <LogOut className="size-4 mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 pt-2">
        <p className="text-xs text-muted-foreground">
          Travereel v1.0.0 • Made with ❤ for travelers
        </p>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="size-20 border-2 border-[#2F5C9B]/20">
                  <AvatarImage
                    src={avatarPreview || editAvatar || undefined}
                    alt="Profile picture preview"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B]/20 to-[#5CA5CD]/20 text-2xl font-bold text-[#2F5C9B]">
                    {editName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      handleAvatarFileSelect({ target } as React.ChangeEvent<HTMLInputElement>)
                    }
                    input.click()
                  }}
                  className="absolute -bottom-1 -right-1 size-7 rounded-full bg-[#5CA5CD] flex items-center justify-center border-2 border-card cursor-pointer hover:bg-[#5CA5CD]/80 transition-colors"
                  aria-label="Upload profile picture"
                >
                  <Camera className="size-3.5 text-white" />
                </button>
                {(avatarPreview || editAvatar) && (
                  <button
                    onClick={handleRemoveAvatarPreview}
                    className="absolute -top-1 -right-1 size-5 rounded-full bg-[#2F5C9B] flex items-center justify-center cursor-pointer hover:bg-[#2F5C9B]/80 transition-colors"
                    aria-label="Remove profile picture"
                  >
                    <X className="size-3 text-white" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {avatarPreview ? 'New photo selected' : 'Click camera to upload a photo'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bio</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Avatar URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://... or upload above"
                  className="rounded-xl flex-1"
                  disabled={!!avatarFile}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      handleAvatarFileSelect({ target } as React.ChangeEvent<HTMLInputElement>)
                    }
                    input.click()
                  }}
                  className="rounded-xl shrink-0 border-border hover:border-[#5CA5CD] hover:text-[#5CA5CD]"
                >
                  <Upload className="size-4" />
                </Button>
              </div>
              {avatarFile && (
                <p className="text-xs text-[#5CA5CD] mt-1">
                  File &quot;{avatarFile.name}&quot; will be uploaded on save
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-xl bg-[#5CA5CD] hover:bg-[#5CA5CD]/90 text-white"
            >
              {isSaving ? (
                isUploadingAvatar ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <Loader2 className="size-4 animate-spin mr-1" />
                )
              ) : (
                <Save className="size-4 mr-1" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isSaving} className="rounded-xl bg-[#5CA5CD] hover:bg-[#5CA5CD]/90 text-white">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Lock className="size-4 mr-1" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Current Email</label>
              <Input
                value={currentUser?.email || ''}
                disabled
                className="rounded-xl bg-muted"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">New Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeEmailOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleChangeEmail} disabled={isSaving} className="rounded-xl bg-[#5CA5CD] hover:bg-[#5CA5CD]/90 text-white">
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Mail className="size-4 mr-1" />}
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p><strong>Last updated:</strong> March 2025</p>
            <h4 className="text-foreground font-semibold">1. Acceptance of Terms</h4>
            <p>By using Travereel, you agree to these terms. If you do not agree, please do not use our service.</p>
            <h4 className="text-foreground font-semibold">2. User Accounts</h4>
            <p>You are responsible for maintaining the confidentiality of your account. You must provide accurate information when creating an account.</p>
            <h4 className="text-foreground font-semibold">3. Content</h4>
            <p>You retain ownership of content you post. By posting, you grant Travereel a license to use, display, and distribute your content within the platform.</p>
            <h4 className="text-foreground font-semibold">4. Community Guidelines</h4>
            <p>Be respectful, do not post harmful or illegal content, and respect other travelers. Violations may result in account suspension.</p>
            <h4 className="text-foreground font-semibold">5. Privacy</h4>
            <p>Your privacy is important to us. Please review our Privacy Policy for information on how we collect, use, and share your data.</p>
            <h4 className="text-foreground font-semibold">6. Disclaimers</h4>
            <p>Travereel is provided &quot;as is&quot; without warranties. We do not guarantee the accuracy of travel information shared by users.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p><strong>Last updated:</strong> March 2025</p>
            <h4 className="text-foreground font-semibold">1. Information We Collect</h4>
            <p>We collect information you provide directly: name, email, profile details, posts, itineraries, and travel preferences.</p>
            <h4 className="text-foreground font-semibold">2. How We Use Your Information</h4>
            <p>We use your information to provide and improve our services, personalize your experience, and communicate with you about your account.</p>
            <h4 className="text-foreground font-semibold">3. Sharing Your Information</h4>
            <p>We do not sell your personal information. We may share information with other users as directed by your privacy settings.</p>
            <h4 className="text-foreground font-semibold">4. Data Security</h4>
            <p>We implement security measures to protect your data. However, no method of electronic storage is 100% secure.</p>
            <h4 className="text-foreground font-semibold">5. Your Choices</h4>
            <p>You can update your account settings, adjust privacy preferences, or delete your account at any time through the Settings page.</p>
            <h4 className="text-foreground font-semibold">6. Contact Us</h4>
            <p>If you have questions about this Privacy Policy, please contact us through the app.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocked Users Dialog */}
      <Dialog open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blocked Users</DialogTitle>
          </DialogHeader>
          <BlockedUsersManagement />
        </DialogContent>
      </Dialog>

      {/* Account Deletion Dialog */}
      <Dialog open={accountDeletionOpen} onOpenChange={setAccountDeletionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <AccountDeletion onSuccess={() => setAccountDeletionOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
