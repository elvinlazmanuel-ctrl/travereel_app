'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Edit,
  Trash2,
  Wallet,
  Play,
  Flag,
  Share2,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  Globe,
  Lock,
  Bell,
  BellRing,
  Map,
  ChevronRight,
  ListChecks,
  Backpack,
  Navigation,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Itinerary, type ItineraryDay } from '@/lib/store'
import DuringTravel from './DuringTravel'
import PostTravel from './PostTravel'
import { ItineraryExport } from './ItineraryExport'
import { ItineraryMap } from './ItineraryMap'
import { CurrencyConverter } from './CurrencyConverter'
import { WeatherForecast } from './WeatherForecast'

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  Japan: '🇯🇵',
  Indonesia: '🇮🇩',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Thailand: '🇹🇭',
  Spain: '🇪🇸',
  Australia: '🇦🇺',
  Greece: '🇬🇷',
  Mexico: '🇲🇽',
  Portugal: '🇵🇹',
  'South Korea': '🇰🇷',
  Vietnam: '🇻🇳',
  Cambodia: '🇰🇭',
  USA: '🇺🇸',
  Brazil: '🇧🇷',
  Germany: '🇩🇪',
  UK: '🇬🇧',
  India: '🇮🇳',
  China: '🇨🇳',
  Peru: '🇵🇪',
  Morocco: '🇲🇦',
  Turkey: '🇹🇷',
  Iceland: '🇮🇸',
  NewZealand: '🇳🇿',
}

function getCountryFlag(country: string): string {
  return countryFlags[country] || '🌍'
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusBadge(status: Itinerary['status']) {
  switch (status) {
    case 'pre-travel':
      return { label: 'Pre-Travel', bgClass: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'during-travel':
      return { label: 'During Travel', bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'post-travel':
      return { label: 'Post-Travel', bgClass: 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/25' }
    default:
      return { label: 'Unknown', bgClass: 'bg-gray-100 text-gray-600 border-gray-200' }
  }
}

export default function ItineraryDetail() {
  const {
    selectedItinerary,
    setSelectedItinerary,
    setCurrentView,
    updateItinerary,
    itineraries,
    setItineraries,
    currentUser,
  } = useAppStore()

  const [fullItinerary, setFullItinerary] = useState<Itinerary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({})
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)

  // Use selectedItinerary from store, or fetch if we need more details
  const itinerary = fullItinerary || selectedItinerary

  // Sync isPublic state with itinerary
  useEffect(() => {
    if (itinerary) {
      setIsPublic(itinerary.isPublic)
    }
  }, [itinerary])

  // Fetch full itinerary data
  const fetchFullItinerary = useCallback(async () => {
    if (!selectedItinerary) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/itineraries/${selectedItinerary.id}`)
      if (res.ok) {
        const data = await res.json()
        const it = data.itinerary
        // Map to store format
        const mapped: Itinerary = {
          id: it.id,
          title: it.title,
          country: it.country,
          location: it.location,
          budget: it.budget,
          currency: it.currency,
          days: it.days,
          travelType: it.travelType,
          activities: Array.isArray(it.activities) ? it.activities : [],
          status: it.status,
          isPublic: it.isPublic,
          requirements: Array.isArray(it.requirements) ? it.requirements : [],
          authorId: it.authorId,
          createdAt: it.createdAt,
          daysPlan: Array.isArray(it.days_plan)
            ? it.days_plan.map((day: Record<string, unknown>) => ({
                id: day.id as string,
                dayNumber: day.dayNumber as number,
                title: day.title as string,
                description: day.description as string,
                route: day.route as string | null,
                status: day.status as ItineraryDay['status'],
                activities: Array.isArray(day.activities)
                  ? day.activities.map((a: Record<string, unknown>) => ({
                      id: a.id as string,
                      title: a.title as string,
                      description: a.description as string | null,
                      location: a.location as string | null,
                      latitude: a.latitude as number | null,
                      longitude: a.longitude as number | null,
                      startTime: a.startTime as string | null,
                      endTime: a.endTime as string | null,
                      cost: a.cost as number,
                      status: a.status as 'pending' | 'completed' | 'skipped',
                      order: a.order as number,
                    }))
                  : [],
              }))
            : [],
          budgetItems: Array.isArray(it.budget_items)
            ? it.budget_items.map((b: Record<string, unknown>) => ({
                id: b.id as string,
                name: b.name as string,
                amount: b.amount as number,
                category: b.category as string,
                paidBy: b.paidBy as string,
                splitAmong: Array.isArray(b.splitAmong) ? b.splitAmong : [],
                itineraryId: b.itineraryId as string,
              }))
            : [],
          companions: Array.isArray(it.companions)
            ? it.companions.map((c: Record<string, unknown>) => ({
                id: c.id as string,
                name: c.name as string,
                email: c.email as string | null,
                userId: c.userId as string | null,
              }))
            : [],
        }
        setFullItinerary(mapped)
        setSelectedItinerary(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch itinerary:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedItinerary, setSelectedItinerary])

  useEffect(() => {
    if (selectedItinerary) {
      // Fetch full data if daysPlan is empty
      if (!selectedItinerary.daysPlan || selectedItinerary.daysPlan.length === 0) {
        fetchFullItinerary()
      }
    }
  }, [selectedItinerary, fetchFullItinerary])

  // Change itinerary status
  const changeStatus = async (newStatus: Itinerary['status']) => {
    if (!itinerary) return
    setIsChangingStatus(true)
    try {
      const res = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        updateItinerary(itinerary.id, { status: newStatus })
        setFullItinerary((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      console.error('Failed to change status:', err)
    } finally {
      setIsChangingStatus(false)
    }
  }

  // Toggle public/private visibility
  const toggleVisibility = async (checked: boolean) => {
    if (!itinerary) return
    setIsUpdatingVisibility(true)
    try {
      const res = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: checked }),
      })
      if (res.ok) {
        setIsPublic(checked)
        updateItinerary(itinerary.id, { isPublic: checked })
        setFullItinerary((prev) => (prev ? { ...prev, isPublic: checked } : null))
      }
    } catch (err) {
      console.error('Failed to update visibility:', err)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  // Send reminder notification
  const sendReminder = async () => {
    if (!itinerary || !currentUser) return
    setIsSendingReminder(true)
    try {
      const uncheckedReqs = itinerary.requirements.filter((req) => !checkedRequirements[req])
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          type: 'reminder',
          message: `Trip reminder for "${itinerary.title}": You have ${uncheckedReqs.length} item${uncheckedReqs.length !== 1 ? 's' : ''} left to prepare. Don't forget to check your requirements before departing to ${itinerary.location}, ${itinerary.country}!`,
        }),
      })
      if (res.ok) {
        setReminderSent(true)
        setTimeout(() => setReminderSent(false), 3000)
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
    } finally {
      setIsSendingReminder(false)
    }
  }

  // Delete itinerary
  const handleDelete = async () => {
    if (!itinerary) return
    try {
      const res = await fetch(`/api/itineraries/${itinerary.id}`, { method: 'DELETE' })
      if (res.ok) {
        setItineraries(itineraries.filter((i) => i.id !== itinerary.id))
        setSelectedItinerary(null)
        setCurrentView('profile')
      }
    } catch (err) {
      console.error('Failed to delete itinerary:', err)
    }
  }

  // Toggle requirement
  const toggleRequirement = (req: string) => {
    setCheckedRequirements((prev) => ({ ...prev, [req]: !prev[req] }))
  }

  if (!itinerary) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <MapPin className="size-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">No Itinerary Selected</h3>
        <p className="text-sm text-gray-500 mt-1">Select an itinerary to view details.</p>
      </div>
    )
  }

  const statusBadge = getStatusBadge(itinerary.status)
  const flag = getCountryFlag(itinerary.country)
  const checkedCount = Object.values(checkedRequirements).filter(Boolean).length
  const totalRequirements = itinerary.requirements.length
  const allChecked = totalRequirements > 0 && checkedCount === totalRequirements

  // Calculate budget summary
  const totalSpent = itinerary.budgetItems.reduce((sum, item) => sum + item.amount, 0)
  const budgetRemaining = itinerary.budget - totalSpent
  const budgetProgress = itinerary.budget > 0 ? Math.min((totalSpent / itinerary.budget) * 100, 100) : 0

  // Count activities with location data
  const activitiesWithLocation = itinerary.daysPlan.flatMap((day) =>
    day.activities.filter((a) => a.latitude != null && a.longitude != null)
  )

  // During-travel view
  if (itinerary.status === 'during-travel') {
    return (
      <div>
        {/* Phase Stepper */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto px-4 pt-3 pb-1"
        >
          <div className="flex items-center justify-between">
            {[
              { key: 'pre-travel', label: 'Pre-Travel', icon: Backpack, color: 'amber' },
              { key: 'during-travel', label: 'During', icon: Navigation, color: 'emerald' },
              { key: 'post-travel', label: 'Post-Travel', icon: Flag, color: 'rose' },
            ].map((phase, index) => {
              const phaseIndex = ['pre-travel', 'during-travel', 'post-travel'].indexOf(itinerary.status)
              const currentIndex = index
              const isActive = itinerary.status === phase.key
              const isCompleted = currentIndex < phaseIndex
              const Icon = phase.icon

              return (
                <div key={phase.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? phase.color === 'amber'
                            ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300'
                            : phase.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300'
                            : 'bg-rose-100 text-rose-600 ring-2 ring-rose-300'
                          : isCompleted
                          ? 'bg-[#2EC4B6] text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium mt-1 ${
                        isActive
                          ? 'text-gray-900'
                          : isCompleted
                          ? 'text-[#2EC4B6]'
                          : 'text-gray-400'
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-0.5 w-8 -mt-4 rounded-full transition-colors ${
                        currentIndex < phaseIndex ? 'bg-[#2EC4B6]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
        {/* Quick Actions Bar */}
        <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#FF8C42] hover:text-[#FF8C42] hover:bg-[#FF8C42]/10 h-8"
            onClick={() => setCurrentView('budget-tracker')}
          >
            <Wallet className="size-3.5 mr-1" />
            Budget
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8">
                <Flag className="size-3.5 mr-1" />
                End Trip
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Your Trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark your trip as completed. You&apos;ll be able to share your experience, view budget summaries, and save memories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Traveling</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => changeStatus('post-travel')}
                  disabled={isChangingStatus}
                  className="bg-emerald-600 text-white"
                >
                  {isChangingStatus ? 'Ending...' : 'End Trip'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <DuringTravel />
      </div>
    )
  }

  // Post-travel view
  if (itinerary.status === 'post-travel') {
    return (
      <div>
        {/* Phase Stepper */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto px-4 pt-3 pb-1"
        >
          <div className="flex items-center justify-between">
            {[
              { key: 'pre-travel', label: 'Pre-Travel', icon: Backpack, color: 'amber' },
              { key: 'during-travel', label: 'During', icon: Navigation, color: 'emerald' },
              { key: 'post-travel', label: 'Post-Travel', icon: Flag, color: 'rose' },
            ].map((phase, index) => {
              const phaseIndex = ['pre-travel', 'during-travel', 'post-travel'].indexOf(itinerary.status)
              const currentIndex = index
              const isActive = itinerary.status === phase.key
              const isCompleted = currentIndex < phaseIndex
              const Icon = phase.icon

              return (
                <div key={phase.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? phase.color === 'amber'
                            ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300'
                            : phase.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300'
                            : 'bg-rose-100 text-rose-600 ring-2 ring-rose-300'
                          : isCompleted
                          ? 'bg-[#2EC4B6] text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium mt-1 ${
                        isActive
                          ? 'text-gray-900'
                          : isCompleted
                          ? 'text-[#2EC4B6]'
                          : 'text-gray-400'
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-0.5 w-8 -mt-4 rounded-full transition-colors ${
                        currentIndex < phaseIndex ? 'bg-[#2EC4B6]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
        {/* Quick Actions Bar */}
        <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#FF8C42] hover:text-[#FF8C42] hover:bg-[#FF8C42]/10 h-8"
            onClick={() => setCurrentView('budget-tracker')}
          >
            <Wallet className="size-3.5 mr-1" />
            Budget
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 h-8"
            onClick={() => changeStatus('pre-travel')}
            disabled={isChangingStatus}
          >
            <Edit className="size-3.5 mr-1" />
            Re-plan
          </Button>
        </div>
        <PostTravel />
      </div>
    )
  }

  // Pre-travel view (default)
  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-6">
      {/* Phase Stepper - Shows current travel phase */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-1"
      >
        <div className="flex items-center justify-between">
          {[
            { key: 'pre-travel', label: 'Pre-Travel', icon: Backpack, color: 'amber' },
            { key: 'during-travel', label: 'During', icon: Navigation, color: 'emerald' },
            { key: 'post-travel', label: 'Post-Travel', icon: Flag, color: 'rose' },
          ].map((phase, index) => {
            const phaseIndex = ['pre-travel', 'during-travel', 'post-travel'].indexOf(itinerary.status)
            const currentIndex = index
            const isActive = itinerary.status === phase.key
            const isCompleted = currentIndex < phaseIndex
            const Icon = phase.icon

            return (
              <div key={phase.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? phase.color === 'amber'
                          ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300'
                          : phase.color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300'
                          : 'bg-rose-100 text-rose-600 ring-2 ring-rose-300'
                        : isCompleted
                        ? 'bg-[#2EC4B6] text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium mt-1 ${
                      isActive
                        ? 'text-gray-900'
                        : isCompleted
                        ? 'text-[#2EC4B6]'
                        : 'text-gray-400'
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-0.5 w-8 -mt-4 rounded-full transition-colors ${
                      currentIndex < phaseIndex ? 'bg-[#2EC4B6]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">{flag}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{itinerary.title}</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {itinerary.location}, {itinerary.country}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${statusBadge.bgClass}`}>
                {statusBadge.label}
              </Badge>
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1">
                <Clock className="size-3 text-gray-400" />
                <span className="text-xs text-gray-500">{itinerary.days} days</span>
              </div>
              <div className="flex items-center gap-1">
                <Wallet className="size-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatCurrency(itinerary.budget, itinerary.currency)}
                </span>
              </div>
              {itinerary.companions.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    +{itinerary.companions.length} companion{itinerary.companions.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public/Private Toggle */}
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <div className="size-7 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center">
                <Globe className="size-3.5 text-[#2EC4B6]" />
              </div>
            ) : (
              <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock className="size-3.5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isPublic ? 'Public' : 'Private'}
              </p>
              <p className="text-[10px] text-gray-400">
                {isPublic ? 'Anyone can discover this itinerary' : 'Only you can see this itinerary'}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={toggleVisibility}
            disabled={isUpdatingVisibility}
            className="data-[state=checked]:bg-[#2EC4B6]"
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2"
      >
        {/* Start Trip */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex-1 h-11 bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] hover:opacity-90 text-white font-semibold">
              <Play className="size-4 mr-1.5" />
              Start Trip
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Your Trip?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change your trip status to &ldquo;During Travel&rdquo;. You&apos;ll be able to track activities, view live alerts, and manage your budget in real-time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not Yet</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => changeStatus('during-travel')}
                disabled={isChangingStatus}
                className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white"
              >
                {isChangingStatus ? 'Starting...' : "Let's Go!"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Budget Tracker */}
        <Button
          variant="outline"
          className="h-11 border-[#FF8C42] text-[#FF8C42] hover:bg-[#FF8C42]/10 font-semibold"
          onClick={() => setCurrentView('budget-tracker')}
        >
          <Wallet className="size-4 mr-1.5" />
          Budget
        </Button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="h-11 border-gray-200 text-gray-400 hover:text-[#FF6B6B] hover:border-[#FF6B6B]/30"
              size="icon"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-[#FF6B6B]" />
                Delete Itinerary
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{itinerary.title}&rdquo;? This action cannot be undone and will remove all days, activities, and budget items.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Prominent Budget & Itinerary Quick Access Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Budget Overview Card */}
        <Card
          className="border-gray-100 shadow-sm cursor-pointer hover:border-[#FF8C42]/30 transition-colors"
          onClick={() => setCurrentView('budget-tracker')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-[#FF8C42]/20 to-[#FFBA49]/20 flex items-center justify-center">
                <Wallet className="size-4 text-[#FF8C42]" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Budget</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(itinerary.budget, itinerary.currency)}
            </p>
            {itinerary.budgetItems.length > 0 && (
              <>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FFBA49] transition-all"
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatCurrency(totalSpent, itinerary.currency)} planned
                  {budgetRemaining >= 0
                    ? ` · ${formatCurrency(budgetRemaining, itinerary.currency)} left`
                    : ` · ${formatCurrency(Math.abs(budgetRemaining), itinerary.currency)} over`}
                </p>
              </>
            )}
            <div className="flex items-center gap-0.5 mt-2 text-[#FF8C42]">
              <span className="text-[10px] font-medium">View details</span>
              <ChevronRight className="size-3" />
            </div>
          </CardContent>
        </Card>

        {/* Itinerary Overview Card */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 flex items-center justify-center">
                <Calendar className="size-4 text-[#FF6B6B]" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Itinerary</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{itinerary.days} Days</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {itinerary.daysPlan.reduce((sum, day) => sum + day.activities.length, 0)} activities planned
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {itinerary.daysPlan.slice(0, 4).map((day) => (
                <div
                  key={day.id}
                  className="size-5 rounded bg-[#FF6B6B]/10 flex items-center justify-center"
                >
                  <span className="text-[8px] font-bold text-[#FF6B6B]">{day.dayNumber}</span>
                </div>
              ))}
              {itinerary.daysPlan.length > 4 && (
                <span className="text-[10px] text-gray-400">+{itinerary.daysPlan.length - 4}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Phase 2: Travel Tools Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Travel Tools</h3>
          <Badge variant="secondary" className="text-[10px] bg-[#2EC4B6]/10 text-[#2EC4B6]">
            NEW
          </Badge>
        </div>

        {/* Export Tools */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Export & Share</h4>
            <ItineraryExport itinerary={itinerary} />
          </CardContent>
        </Card>

        {/* Weather Forecast */}
        <WeatherForecast
          location={itinerary.location}
          country={itinerary.country}
          departureDate={itinerary.departureDate}
          returnDate={itinerary.returnDate}
        />

        {/* Currency Converter */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Currency Converter</h4>
            <CurrencyConverter
              defaultFrom={itinerary.currency}
              defaultTo="USD"
              defaultAmount={itinerary.budget}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Calculate Trip - Interactive Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Map className="size-4 text-[#FF6B6B]" />
                {activitiesWithLocation.length > 0 ? 'Activity Locations' : 'Destination'}
                <Badge variant="secondary" className="text-[10px] bg-[#FF6B6B]/10 text-[#FF6B6B] ml-auto">
                  {activitiesWithLocation.length > 0 ? `${activitiesWithLocation.length} spots` : itinerary.location}
                </Badge>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {activitiesWithLocation.length > 0
                  ? 'Your planned activity locations'
                  : 'Explore your destination before you go'}
              </p>
            </div>
            {/* Location details */}
            <div className="px-4 pb-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 text-[#FF6B6B]" />
                  <span className="text-xs text-gray-500">{itinerary.location}, {itinerary.country}</span>
                </div>
                {activitiesWithLocation.length > 0 && (
                  <div className="space-y-1.5">
                    {itinerary.daysPlan.map((day) =>
                      day.activities
                        .filter((a) => a.latitude != null && a.longitude != null)
                        .map((activity) => (
                          <div key={activity.id} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="size-1.5 rounded-full bg-[#FF6B6B] shrink-0" />
                            <span className="font-medium text-gray-700">Day {day.dayNumber}:</span>
                            <span>{activity.title}</span>
                            {activity.location && (
                              <span className="text-gray-400">· {activity.location}</span>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                )}
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(itinerary.location + ', ' + itinerary.country)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#FF8C42] font-medium hover:underline"
                >
                  Open in OpenStreetMap
                </a>
              </div>
            </div>

            {/* Day color legend */}
            {activitiesWithLocation.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] text-gray-400 font-medium shrink-0">Days:</span>
                {itinerary.daysPlan.map((day, i) => (
                  <div key={day.id} className="flex items-center gap-1 shrink-0">
                    <div className={`size-2.5 rounded-full marker-day-${(i % 7) + 1}`} />
                    <span className="text-[10px] text-gray-500">{day.dayNumber}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick trip stats */}
            <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-gray-400" />
                <span className="text-xs text-gray-500">{itinerary.days} days trip</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Backpack className="size-3 text-gray-400" />
                <span className="text-xs text-gray-500 capitalize">{itinerary.travelType}</span>
              </div>
              {itinerary.companions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Share2 className="size-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{itinerary.companions.length + 1} travelers</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Days Plan Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="size-4 text-[#FF8C42]" />
                Days Plan
                <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 ml-auto">
                  {itinerary.daysPlan.length} days
                </Badge>
              </h3>
            </div>

            {isLoading ? (
              <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : itinerary.daysPlan.length === 0 ? (
              <div className="px-4 pb-6 text-center">
                <Circle className="size-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No days planned yet</p>
              </div>
            ) : (
              <Accordion type="multiple" className="px-4 pb-2">
                {itinerary.daysPlan.map((day) => {
                  const dayCost = day.activities.reduce((sum, a) => sum + a.cost, 0)

                  return (
                    <AccordionItem key={day.id} value={day.id} className="border-gray-100">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2.5 text-left flex-1 min-w-0">
                          <div className="size-8 rounded-lg bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#FF8C42]">D{day.dayNumber}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {day.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {day.activities.length} activities
                              </span>
                              {dayCost > 0 && (
                                <span className="text-xs text-gray-400">
                                  · {formatCurrency(dayCost, itinerary.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* Route info */}
                        {day.route && (
                          <div className="flex items-center gap-1.5 mb-3 px-1">
                            <MapPin className="size-3 text-[#FF6B6B]" />
                            <span className="text-xs text-gray-500">Route: {day.route}</span>
                          </div>
                        )}

                        {/* Activities */}
                        <div className="space-y-2">
                          {day.activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-2.5 rounded-lg border border-gray-100 px-3 py-2"
                            >
                              <div className="mt-0.5">
                                <div className="size-2 rounded-full bg-[#FF8C42]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{activity.title}</p>
                                {activity.location && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <MapPin className="size-2.5 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-400 truncate">
                                      {activity.location}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {activity.startTime && (
                                    <span className="text-[10px] text-gray-400">
                                      {activity.startTime}
                                      {activity.endTime ? ` - ${activity.endTime}` : ''}
                                    </span>
                                  )}
                                  {activity.cost > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      {formatCurrency(activity.cost, itinerary.currency)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Requirements Checklist */}
      {itinerary.requirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className={`border shadow-sm transition-colors ${allChecked ? 'border-[#2EC4B6]/30 bg-[#2EC4B6]/5' : 'border-[#FFBA49]/30 bg-[#FFBA49]/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ListChecks className="size-4 text-[#2EC4B6]" />
                  Trip Requirements
                </h3>
                <Badge
                  className={`text-[10px] border-0 ${
                    allChecked
                      ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                      : checkedCount > 0
                        ? 'bg-[#FFBA49]/15 text-[#FF8C42]'
                        : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                  }`}
                >
                  {checkedCount}/{totalRequirements}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full transition-colors ${
                    allChecked
                      ? 'bg-[#2EC4B6]'
                      : checkedCount > 0
                        ? 'bg-gradient-to-r from-[#FF8C42] to-[#FFBA49]'
                        : 'bg-gray-200'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${totalRequirements > 0 ? (checkedCount / totalRequirements) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Status message */}
              <div className={`flex items-center gap-2 mb-3 rounded-lg px-3 py-2 ${
                allChecked ? 'bg-[#2EC4B6]/10' : 'bg-[#FFBA49]/10'
              }`}>
                {allChecked ? (
                  <>
                    <CheckCircle2 className="size-4 text-[#2EC4B6] flex-shrink-0" />
                    <p className="text-xs font-medium text-[#2EC4B6]">All set! You&apos;re ready for your trip.</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4 text-[#FF8C42] flex-shrink-0" />
                    <p className="text-xs font-medium text-[#FF8C42]">
                      {totalRequirements - checkedCount} item{totalRequirements - checkedCount !== 1 ? 's' : ''} still needed before your trip
                    </p>
                  </>
                )}
              </div>

              {/* Checklist */}
              <div className="space-y-2.5">
                {itinerary.requirements.map((req, index) => {
                  const isChecked = checkedRequirements[req] || false
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                        isChecked ? 'bg-[#2EC4B6]/5' : 'bg-white border border-gray-100'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleRequirement(req)}
                        className="data-[state=checked]:bg-[#2EC4B6] data-[state=checked]:border-[#2EC4B6]"
                      />
                      <span
                        className={`text-sm transition-colors ${
                          isChecked ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'
                        }`}
                      >
                        {req}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Send Reminder Button */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  className={`w-full h-9 font-medium transition-all ${
                    reminderSent
                      ? 'border-[#2EC4B6] text-[#2EC4B6] bg-[#2EC4B6]/10'
                      : 'border-[#FF8C42]/30 text-[#FF8C42] hover:bg-[#FF8C42]/10 hover:border-[#FF8C42]'
                  }`}
                  onClick={sendReminder}
                  disabled={isSendingReminder || reminderSent}
                >
                  {reminderSent ? (
                    <>
                      <CheckCircle2 className="size-3.5 mr-1.5" />
                      Reminder Sent!
                    </>
                  ) : (
                    <>
                      <BellRing className="size-3.5 mr-1.5" />
                      {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Companions */}
      {itinerary.companions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Share2 className="size-4 text-[#E879A8]" />
                Travel Companions
              </h3>
              <div className="flex flex-wrap gap-2">
                {itinerary.companions.map((companion) => (
                  <div
                    key={companion.id}
                    className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5"
                  >
                    <div className="size-6 rounded-full bg-[#FF8C42]/10 flex items-center justify-center text-[10px] font-medium text-[#FF8C42]">
                      {companion.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{companion.name}</span>
                  </div>
                ))}
                {currentUser && (
                  <div className="flex items-center gap-2 rounded-full bg-[#FF6B6B]/10 px-3 py-1.5">
                    <div className="size-6 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center text-[10px] font-medium text-[#FF6B6B]">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-[#FF6B6B]">You (Organizer)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
