'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  X,
  Trash2,
  Clock,
  MapPin,
  Wallet,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Save,
  CheckSquare,
  Square,
  Route,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ManualActivity {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  cost: number
}

interface ManualDay {
  id: string
  dayNumber: number
  title: string
  description: string
  route: string
  activities: ManualActivity[]
  expanded: boolean
}

const defaultRequirements = [
  'Valid Passport',
  'Travel Visa (if required)',
  'Travel Insurance',
  'Vaccination Records',
  'Local Currency',
  'Emergency Contacts',
  'Accommodation Booking',
  'Flight Tickets',
]

export default function ManualInputForm() {
  const { wizardData, currentUser, addItinerary, setCurrentView, resetWizard } = useAppStore()

  const [days, setDays] = useState<ManualDay[]>(() =>
    Array.from({ length: wizardData.days }, (_, i) => ({
      id: `day-${Date.now()}-${i}`,
      dayNumber: i + 1,
      title: `Day ${i + 1}`,
      description: '',
      route: '',
      activities: [],
      expanded: i === 0,
    }))
  )

  const [requirements, setRequirements] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggleDayExpand = (dayId: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, expanded: !d.expanded } : d))
  }

  const updateDay = (dayId: string, field: keyof ManualDay, value: string | ManualActivity[]) => {
    setDays(days.map(d => d.id === dayId ? { ...d, [field]: value } : d))
  }

  const addActivity = (dayId: string) => {
    const newActivity: ManualActivity = {
      id: `act-${Date.now()}`,
      title: '',
      description: '',
      location: '',
      startTime: '09:00',
      endTime: '10:00',
      cost: 0,
    }
    setDays(days.map(d =>
      d.id === dayId
        ? { ...d, activities: [...d.activities, newActivity] }
        : d
    ))
  }

  const updateActivity = (dayId: string, activityId: string, field: keyof ManualActivity, value: string | number) => {
    setDays(days.map(d =>
      d.id === dayId
        ? {
            ...d,
            activities: d.activities.map(a =>
              a.id === activityId ? { ...a, [field]: value } : a
            ),
          }
        : d
    ))
  }

  const removeActivity = (dayId: string, activityId: string) => {
    setDays(days.map(d =>
      d.id === dayId
        ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
        : d
    ))
  }

  const moveActivity = (dayId: string, index: number, direction: 'up' | 'down') => {
    const day = days.find(d => d.id === dayId)
    if (!day) return
    const newActivities = [...day.activities]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newActivities.length) return
    ;[newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]]
    setDays(days.map(d => d.id === dayId ? { ...d, activities: newActivities } : d))
  }

  const addDay = () => {
    setDays([
      ...days,
      {
        id: `day-${Date.now()}`,
        dayNumber: days.length + 1,
        title: `Day ${days.length + 1}`,
        description: '',
        route: '',
        activities: [],
        expanded: true,
      },
    ])
  }

  const removeDay = (dayId: string) => {
    const filtered = days.filter(d => d.id !== dayId)
    setDays(filtered.map((d, i) => ({ ...d, dayNumber: i + 1 })))
  }

  const toggleRequirement = (req: string) => {
    if (requirements.includes(req)) {
      setRequirements(requirements.filter(r => r !== req))
    } else {
      setRequirements([...requirements, req])
    }
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)

    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: wizardData.title || `${wizardData.location} Trip`,
          country: wizardData.country,
          location: wizardData.location,
          budget: wizardData.budget,
          currency: wizardData.currency,
          days: days.length,
          travelType: wizardData.travelType,
          activities: wizardData.activities,
          isPublic: false,
          requirements,
          authorId: currentUser.id,
          daysPlan: days.map(day => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            route: day.route || undefined,
            activities: day.activities.map((activity, index) => ({
              title: activity.title,
              description: activity.description || undefined,
              location: activity.location || undefined,
              startTime: activity.startTime || undefined,
              endTime: activity.endTime || undefined,
              cost: activity.cost || 0,
              order: index,
            })),
          })),
          budgetItems: [],
          companions: wizardData.companions.map(c => ({
            name: c.name,
            email: c.email || undefined,
            userId: c.userId || undefined,
          })),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        addItinerary({
          ...data.itinerary,
          daysPlan: data.itinerary.days_plan || [],
          budgetItems: data.itinerary.budget_items || [],
          companions: data.itinerary.companions || [],
        })
        resetWizard()
        setCurrentView('profile')
      }
    } catch {
      // Silently handle
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-[#2EC4B6] to-[#FFBA49] flex items-center justify-center">
          <Route className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Plan Your Itinerary</h2>
          <p className="text-xs text-gray-500">
            {wizardData.location}, {wizardData.country} &middot; {days.length} days
          </p>
        </div>
      </div>

      {/* Day Tabs/Accordion */}
      <div className="space-y-3">
        {days.map((day) => (
          <div
            key={day.id}
            className="rounded-xl border border-gray-100 overflow-hidden"
          >
            {/* Day Header */}
            <button
              onClick={() => toggleDayExpand(day.id)}
              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div
                className="size-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-xs"
                style={{
                  background: `linear-gradient(135deg, ${
                    day.dayNumber === 1
                      ? '#FF6B6B, #FF8C42'
                      : day.dayNumber === days.length
                      ? '#2EC4B6, #FFBA49'
                      : '#FF8C42, #FFBA49'
                  })`,
                }}
              >
                D{day.dayNumber}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <Input
                  value={day.title}
                  onChange={(e) => updateDay(day.id, 'title', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-auto p-0 border-0 text-sm font-bold text-gray-900 focus:ring-0 focus:outline-none bg-transparent"
                  placeholder={`Day ${day.dayNumber}`}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                </Badge>
                {days.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDay(day.id)
                    }}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    aria-label="Remove day"
                  >
                    <Trash2 className="size-3.5 text-gray-300 hover:text-[#FF6B6B]" />
                  </button>
                )}
                {day.expanded ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Day Content */}
            <AnimatePresence>
              {day.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    {/* Description */}
                    <Textarea
                      placeholder="Brief description of the day..."
                      value={day.description}
                      onChange={(e) => updateDay(day.id, 'description', e.target.value)}
                      className="min-h-[60px] text-sm"
                    />

                    {/* Route */}
                    <div className="relative">
                      <Route className="absolute left-3 top-3 size-4 text-gray-400" />
                      <Input
                        placeholder="Route / transportation notes..."
                        value={day.route}
                        onChange={(e) => updateDay(day.id, 'route', e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>

                    {/* Activities List */}
                    <div className="space-y-2">
                      {day.activities.map((activity, actIndex) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="size-4 text-gray-300 shrink-0" />
                            <Input
                              placeholder="Activity title"
                              value={activity.title}
                              onChange={(e) => updateActivity(day.id, activity.id, 'title', e.target.value)}
                              className="flex-1 h-8 text-sm border-0 bg-white"
                            />
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => moveActivity(day.id, actIndex, 'up')}
                                disabled={actIndex === 0}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                                aria-label="Move up"
                              >
                                <ChevronUp className="size-3" />
                              </button>
                              <button
                                onClick={() => moveActivity(day.id, actIndex, 'down')}
                                disabled={actIndex === day.activities.length - 1}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                                aria-label="Move down"
                              >
                                <ChevronDown className="size-3" />
                              </button>
                              <button
                                onClick={() => removeActivity(day.id, activity.id)}
                                className="p-1 rounded hover:bg-red-50"
                                aria-label="Remove activity"
                              >
                                <X className="size-3.5 text-gray-400 hover:text-[#FF6B6B]" />
                              </button>
                            </div>
                          </div>

                          <Textarea
                            placeholder="Activity description (optional)"
                            value={activity.description}
                            onChange={(e) => updateActivity(day.id, activity.id, 'description', e.target.value)}
                            className="min-h-[40px] text-xs"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-gray-400" />
                              <Input
                                placeholder="Location"
                                value={activity.location}
                                onChange={(e) => updateActivity(day.id, activity.id, 'location', e.target.value)}
                                className="pl-8 h-7 text-xs"
                              />
                            </div>
                            <div className="relative">
                              <Wallet className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="Cost"
                                value={activity.cost || ''}
                                onChange={(e) => updateActivity(day.id, activity.id, 'cost', Number(e.target.value) || 0)}
                                className="pl-8 h-7 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="size-3 text-gray-400" />
                              <Input
                                type="time"
                                value={activity.startTime}
                                onChange={(e) => updateActivity(day.id, activity.id, 'startTime', e.target.value)}
                                className="h-7 text-xs w-[90px]"
                              />
                            </div>
                            <span className="text-xs text-gray-400">to</span>
                            <Input
                              type="time"
                              value={activity.endTime}
                              onChange={(e) => updateActivity(day.id, activity.id, 'endTime', e.target.value)}
                              className="h-7 text-xs w-[90px]"
                            />
                          </div>
                        </motion.div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addActivity(day.id)}
                        className="w-full border-dashed border-[#2EC4B6]/40 text-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:border-[#2EC4B6]"
                      >
                        <Plus className="size-4 mr-1" />
                        Add Activity
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Add Day Button */}
      <Button
        variant="outline"
        onClick={addDay}
        className="w-full border-dashed border-[#FF8C42]/40 text-[#FF8C42] hover:bg-[#FF8C42]/5 hover:border-[#FF8C42]"
      >
        <Plus className="size-4 mr-2" />
        Add Day
      </Button>

      {/* Requirements Checklist */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Requirements & Preparation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {defaultRequirements.map((req) => {
            const checked = requirements.includes(req)
            return (
              <button
                key={req}
                onClick={() => toggleRequirement(req)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                  checked
                    ? 'border-[#2EC4B6] bg-[#2EC4B6]/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {checked ? (
                  <CheckSquare className="size-4 text-[#2EC4B6] shrink-0" />
                ) : (
                  <Square className="size-4 text-gray-300 shrink-0" />
                )}
                <span className={`text-xs font-medium ${checked ? 'text-gray-800' : 'text-gray-500'}`}>
                  {req}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#2EC4B6] to-[#FFBA49] text-white h-12 text-base font-semibold"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="size-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Save className="size-5 mr-2" />
              Save Itinerary
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
