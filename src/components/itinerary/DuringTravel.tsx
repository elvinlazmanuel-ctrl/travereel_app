'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  SkipForward,
  Clock,
  MapPin,
  Wallet,
  ChevronRight,
  Circle,
  CloudRain,
  AlertTriangle,
  Shield,
  X,
  Navigation,
  TrendingUp,
  Activity,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAppStore, type DayActivity, type ItineraryDay } from '@/lib/store'

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

function formatTime(time: string | null): string {
  if (!time) return '--:--'
  return time
}

// ─── Alert Types & Data ────────────────────────────────────────

type AlertType = 'weather' | 'advisory' | 'safety'

interface TravelAlert {
  id: string
  type: AlertType
  title: string
  description: string
  timestamp: string
}

const alertPools: Record<string, TravelAlert[]> = {
  Japan: [
    { id: 'jp-w1', type: 'weather', title: 'Rain expected tomorrow', description: 'Heavy rainfall forecasted in Tokyo. Carry an umbrella and plan indoor activities.', timestamp: '2 min ago' },
    { id: 'jp-w2', type: 'weather', title: 'High UV warning', description: 'UV index will be very high in Osaka. Apply sunscreen and stay hydrated.', timestamp: '15 min ago' },
    { id: 'jp-a1', type: 'advisory', title: 'Local festival today', description: 'Sanja Matsuri festival in Asakusa — expect large crowds and road closures.', timestamp: '30 min ago' },
    { id: 'jp-a2', type: 'advisory', title: 'Train delay on Yamanote Line', description: 'Expect 10–15 min delays due to signal issues. Consider alternate routes.', timestamp: '1 hr ago' },
    { id: 'jp-s1', type: 'safety', title: 'Keep valuables secure', description: 'Crowded areas in Shibuya may have pickpockets. Keep bags zipped and close.', timestamp: '5 min ago' },
    { id: 'jp-s2', type: 'safety', title: 'Earthquake preparedness', description: 'Minor seismic activity detected. Review evacuation routes at your hotel.', timestamp: '45 min ago' },
  ],
  Indonesia: [
    { id: 'id-w1', type: 'weather', title: 'Tropical storm warning', description: 'Monsoon rains expected in Bali this afternoon. Avoid beach activities after 3 PM.', timestamp: '5 min ago' },
    { id: 'id-w2', type: 'weather', title: 'High humidity alert', description: 'Heat index may reach 42°C in Jakarta. Stay hydrated and seek shade often.', timestamp: '20 min ago' },
    { id: 'id-a1', type: 'advisory', title: 'Road closure on Jl. Kuta', description: 'Construction on main road to Kuta Beach — take alternate route via Jl. Legian.', timestamp: '10 min ago' },
    { id: 'id-a2', type: 'advisory', title: 'Volcanic activity advisory', description: 'Mount Agung alert level raised. Check latest updates before visiting nearby areas.', timestamp: '1 hr ago' },
    { id: 'id-s1', type: 'safety', title: 'Scam awareness', description: 'Reported taxi scams at Denpasar airport. Use official taxi counters or ride apps.', timestamp: '30 min ago' },
  ],
  France: [
    { id: 'fr-w1', type: 'weather', title: 'Rain expected this evening', description: 'Showers forecasted in Paris after 6 PM. Plan indoor dining for dinner.', timestamp: '3 min ago' },
    { id: 'fr-w2', type: 'weather', title: 'Heat wave warning', description: 'Temperatures reaching 36°C in Nice. Stay hydrated and avoid midday sun.', timestamp: '15 min ago' },
    { id: 'fr-a1', type: 'advisory', title: 'Metro Line 4 disruption', description: 'Partial closure on Line 4 between Châtelet and Gare du Nord this weekend.', timestamp: '25 min ago' },
    { id: 'fr-a2', type: 'advisory', title: 'Local market day', description: 'Marché d\'Aligre is open today — great for local produce and souvenirs!', timestamp: '1 hr ago' },
    { id: 'fr-s1', type: 'safety', title: 'Pickpocket warning', description: 'High pickpocket activity reported near Eiffel Tower. Secure your belongings.', timestamp: '10 min ago' },
  ],
  Italy: [
    { id: 'it-w1', type: 'weather', title: 'Thunderstorm warning', description: 'Afternoon thunderstorms expected in Rome. Plan morning outdoor activities.', timestamp: '8 min ago' },
    { id: 'it-w2', type: 'weather', title: 'High UV index', description: 'UV levels very high in Amalfi Coast. Sunscreen SPF 50+ recommended.', timestamp: '30 min ago' },
    { id: 'it-a1', type: 'advisory', title: 'Transportation strike', description: 'Local bus strike in Florence today. Use tram services or walk.', timestamp: '20 min ago' },
    { id: 'it-a2', type: 'advisory', title: 'Festival today', description: 'Festa di San Giovanni fireworks tonight at 10 PM by the river.', timestamp: '45 min ago' },
    { id: 'it-s1', type: 'safety', title: 'Tourist scam alert', description: 'Fake petition scams near Colosseum. Decline firmly and walk away.', timestamp: '5 min ago' },
  ],
  Thailand: [
    { id: 'th-w1', type: 'weather', title: 'Monsoon rain expected', description: 'Heavy afternoon rain in Bangkok. Plan indoor activities between 2–5 PM.', timestamp: '5 min ago' },
    { id: 'th-w2', type: 'weather', title: 'Extreme heat warning', description: 'Feels-like temperature of 44°C in Chiang Mai. Stay hydrated and rest often.', timestamp: '15 min ago' },
    { id: 'th-a1', type: 'advisory', title: 'Road closure on Sukhumvit', description: 'Water main repair causing lane closures. Expect traffic delays.', timestamp: '30 min ago' },
    { id: 'th-a2', type: 'advisory', title: 'Night market tonight', description: 'Chatuchak Night Market open 6 PM–midnight — perfect for street food!', timestamp: '1 hr ago' },
    { id: 'th-s1', type: 'safety', title: 'Stay aware in crowded areas', description: 'Keep bags secure at night markets. Reported bag-snatching incidents.', timestamp: '10 min ago' },
  ],
}

// Default alerts for countries without specific pools
const defaultAlerts: TravelAlert[] = [
  { id: 'def-w1', type: 'weather', title: 'Weather change expected', description: 'Check local forecast — weather patterns shifting over the next 24 hours.', timestamp: '5 min ago' },
  { id: 'def-w2', type: 'weather', title: 'High UV warning', description: 'UV levels elevated today. Apply sunscreen and wear protective clothing.', timestamp: '20 min ago' },
  { id: 'def-a1', type: 'advisory', title: 'Local event today', description: 'Check for local events that may affect transportation and crowd levels.', timestamp: '30 min ago' },
  { id: 'def-a2', type: 'advisory', title: 'Road work nearby', description: 'Construction on major routes may cause delays. Plan extra travel time.', timestamp: '1 hr ago' },
  { id: 'def-s1', type: 'safety', title: 'Keep valuables secure', description: 'Remain vigilant in crowded tourist areas. Keep belongings close.', timestamp: '10 min ago' },
]

function getAlertsForCountry(country: string): TravelAlert[] {
  const pool = alertPools[country] || defaultAlerts
  // Randomly select 2-3 alerts on mount (simulated rotation)
  const count = 2 + Math.floor(Math.random() * 2) // 2 or 3
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function getAlertColor(type: AlertType) {
  switch (type) {
    case 'weather':
      return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', title: 'text-blue-800', desc: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
    case 'advisory':
      return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', title: 'text-amber-800', desc: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' }
    case 'safety':
      return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', title: 'text-red-800', desc: 'text-red-600', badge: 'bg-red-100 text-red-700' }
  }
}

// ─── Alert Card Component ──────────────────────────────────────

function AlertCard({ alert, onDismiss }: { alert: TravelAlert; onDismiss: (id: string) => void }) {
  const colors = getAlertColor(alert.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <Card className={`${colors.bg} ${colors.border} border shadow-sm`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2.5">
            <div className={`size-8 rounded-lg ${colors.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {alert.type === 'weather' && <CloudRain className="size-4" />}
              {alert.type === 'advisory' && <AlertTriangle className="size-4" />}
              {alert.type === 'safety' && <Shield className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`text-xs font-semibold ${colors.title} leading-tight`}>
                  {alert.title}
                </h4>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-black/5 transition-colors ${colors.icon}`}
                >
                  <X className="size-3" />
                </button>
              </div>
              <p className={`text-[11px] ${colors.desc} mt-0.5 leading-relaxed`}>
                {alert.description}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{alert.timestamp}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Circular Progress Component ───────────────────────────────

function CircularProgress({ percentage, size = 64, strokeWidth = 5 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2EC4B6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

// ─── Status badge config ───────────────────────────────────────

function getStatusBadge(status: DayActivity['status']) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', bgClass: 'bg-emerald-100 text-emerald-700' }
    case 'skipped':
      return { label: 'Skipped', bgClass: 'bg-gray-100 text-gray-500' }
    default:
      return { label: 'Pending', bgClass: 'bg-amber-100 text-amber-700' }
  }
}

// ─── Main Component ────────────────────────────────────────────

export default function DuringTravel() {
  const { selectedItinerary, setCurrentView } = useAppStore()
  const [selectedDay, setSelectedDay] = useState(1)
  const [localActivities, setLocalActivities] = useState<Record<string, DayActivity['status']>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Alerts state — generated once on mount
  const [alerts, setAlerts] = useState<TravelAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Generate alerts on mount based on country
  useEffect(() => {
    if (selectedItinerary?.country) {
      const generated = getAlertsForCountry(selectedItinerary.country)
      setAlerts(generated)
    }
  }, [selectedItinerary?.country])

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]))
  }, [])

  const visibleAlerts = useMemo(
    () => alerts.filter(a => !dismissedAlerts.has(a.id)),
    [alerts, dismissedAlerts]
  )

  // Get days from itinerary
  const days: ItineraryDay[] = selectedItinerary?.daysPlan || []
  const currentDay = days.find((d) => d.dayNumber === selectedDay)
  const activities = currentDay?.activities || []

  // Calculate completion stats
  const allActivities = days.flatMap((d) => d.activities)
  const completedCount = allActivities.filter(
    (a) => (localActivities[a.id] || a.status) === 'completed'
  ).length
  const skippedCount = allActivities.filter(
    (a) => (localActivities[a.id] || a.status) === 'skipped'
  ).length
  const totalActivities = allActivities.length
  const completionPercentage = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0

  // Today's stats
  const todayCompleted = activities.filter(
    (a) => (localActivities[a.id] || a.status) === 'completed'
  ).length
  const todayTotal = activities.length

  // Today's budget
  const todaySpent = activities
    .filter((a) => (localActivities[a.id] || a.status) === 'completed')
    .reduce((sum, a) => sum + a.cost, 0)
  const totalBudget = selectedItinerary?.budget || 0
  const currency = selectedItinerary?.currency || 'USD'

  // Find the "current" day (first day with pending activities)
  const currentTravelDay = useMemo(() => {
    for (const day of days) {
      const hasPending = day.activities.some(
        (a) => (localActivities[a.id] || a.status) === 'pending'
      )
      if (hasPending) return day.dayNumber
    }
    return days.length // all done
  }, [days, localActivities])

  // Compute map center from itinerary
  const mapLocation = useMemo(() => {
    if (!selectedItinerary) return { lat: 35.6762, lng: 139.6503, zoom: 12, label: 'Tokyo' }
    // Try to get coordinates from current day's first activity with coords
    const activityWithCoords = activities.find(a => a.latitude && a.longitude)
    if (activityWithCoords?.latitude && activityWithCoords?.longitude) {
      return {
        lat: activityWithCoords.latitude,
        lng: activityWithCoords.longitude,
        zoom: 14,
        label: activityWithCoords.location || selectedItinerary.location,
      }
    }
    // Fallback: use location name for geocoding lookup
    const locationMap: Record<string, { lat: number; lng: number; zoom: number }> = {
      'Tokyo': { lat: 35.6762, lng: 139.6503, zoom: 12 },
      'Kyoto': { lat: 35.0116, lng: 135.7681, zoom: 13 },
      'Osaka': { lat: 34.6937, lng: 135.5023, zoom: 13 },
      'Bali': { lat: -8.3405, lng: 115.092, zoom: 11 },
      'Jakarta': { lat: -6.2088, lng: 106.8456, zoom: 12 },
      'Paris': { lat: 48.8566, lng: 2.3522, zoom: 13 },
      'Nice': { lat: 43.7102, lng: 7.262, zoom: 13 },
      'Rome': { lat: 41.9028, lng: 12.4964, zoom: 13 },
      'Florence': { lat: 43.7696, lng: 11.2558, zoom: 13 },
      'Bangkok': { lat: 13.7563, lng: 100.5018, zoom: 12 },
      'Chiang Mai': { lat: 18.7883, lng: 98.9853, zoom: 13 },
      'Barcelona': { lat: 41.3874, lng: 2.1686, zoom: 13 },
      'Madrid': { lat: 40.4168, lng: -3.7038, zoom: 12 },
      'Sydney': { lat: -33.8688, lng: 151.2093, zoom: 12 },
      'Santorini': { lat: 36.3932, lng: 25.4615, zoom: 13 },
      'Cancun': { lat: 21.1619, lng: -86.8515, zoom: 12 },
      'Lisbon': { lat: 38.7223, lng: -9.1393, zoom: 13 },
      'Seoul': { lat: 37.5665, lng: 126.978, zoom: 12 },
      'Hanoi': { lat: 21.0278, lng: 105.8342, zoom: 12 },
      'Siem Reap': { lat: 13.3671, lng: 103.8448, zoom: 13 },
      'New York': { lat: 40.7128, lng: -74.006, zoom: 12 },
      'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, zoom: 12 },
      'Berlin': { lat: 52.52, lng: 13.405, zoom: 12 },
      'London': { lat: 51.5074, lng: -0.1278, zoom: 12 },
      'Mumbai': { lat: 19.076, lng: 72.8777, zoom: 12 },
      'Beijing': { lat: 39.9042, lng: 116.4074, zoom: 12 },
      'Cusco': { lat: -13.532, lng: -71.967, zoom: 13 },
      'Marrakech': { lat: 31.6295, lng: -7.9811, zoom: 13 },
      'Istanbul': { lat: 41.0082, lng: 28.9784, zoom: 12 },
      'Reykjavik': { lat: 64.1466, lng: -21.9426, zoom: 12 },
      'Auckland': { lat: -36.8485, lng: 174.7633, zoom: 12 },
    }
    const loc = locationMap[selectedItinerary.location] || { lat: 35.6762, lng: 139.6503, zoom: 11 }
    return { ...loc, label: selectedItinerary.location }
  }, [selectedItinerary, activities])

  // Update activity status
  const updateActivityStatus = useCallback(
    async (activityId: string, status: DayActivity['status']) => {
      if (!selectedItinerary) return
      setIsUpdating(activityId)

      // Optimistic update
      setLocalActivities((prev) => ({ ...prev, [activityId]: status }))

      try {
        const res = await fetch(`/api/itineraries/${selectedItinerary.id}/activity`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityId, status }),
        })

        if (!res.ok) {
          // Revert on failure
          setLocalActivities((prev) => {
            const next = { ...prev }
            delete next[activityId]
            return next
          })
        }
      } catch (err) {
        console.error('Failed to update activity:', err)
        setLocalActivities((prev) => {
          const next = { ...prev }
          delete next[activityId]
          return next
        })
      } finally {
        setIsUpdating(null)
      }
    },
    [selectedItinerary]
  )

  // Get effective status
  const getStatus = (activity: DayActivity): DayActivity['status'] => {
    return localActivities[activity.id] || activity.status
  }

  if (!selectedItinerary) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <Circle className="size-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">No Active Trip</h3>
        <p className="text-sm text-gray-500 mt-1">Select an itinerary to view your travel details.</p>
      </div>
    )
  }

  const flag = getCountryFlag(selectedItinerary.country)

  return (
    <div className="max-w-md mx-auto pb-6">
      {/* ── Live Alert/Warning Cards ── */}
      <AnimatePresence>
        {visibleAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pt-4 space-y-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="size-3.5 text-[#FF6B6B]" />
              <span className="text-xs font-semibold text-gray-700">Live Alerts</span>
              <Badge variant="secondary" className="h-4 text-[9px] px-1.5 bg-red-100 text-red-600">
                {visibleAlerts.length} active
              </Badge>
            </div>
            {visibleAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-3 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flag}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedItinerary.title}</h2>
              <p className="text-xs text-gray-500">
                Day {selectedDay} of {selectedItinerary.days} · {selectedItinerary.location}
              </p>
            </div>
          </div>
          <CircularProgress percentage={completionPercentage} />
        </div>
      </motion.div>

      {/* ── Enhanced Activity Tracking: Progress Summary ── */}
      <div className="px-4 py-2">
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-3.5">
            {/* Trip Progress Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-[#2EC4B6]" />
                <span className="text-xs font-semibold text-gray-700">Trip Progress</span>
              </div>
              <span className="text-[11px] text-gray-500">
                Day {currentTravelDay} of {selectedItinerary.days}
              </span>
            </div>
            <Progress
              value={(currentTravelDay / selectedItinerary.days) * 100}
              className="h-2 bg-gray-100 mb-3"
            />

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                </div>
                <p className="text-base font-bold text-emerald-600">{completedCount}</p>
                <p className="text-[10px] text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <SkipForward className="size-3 text-gray-400" />
                </div>
                <p className="text-base font-bold text-gray-500">{skippedCount}</p>
                <p className="text-[10px] text-gray-400">Skipped</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="size-3 text-amber-500" />
                </div>
                <p className="text-base font-bold text-amber-600">
                  {totalActivities - completedCount - skippedCount}
                </p>
                <p className="text-[10px] text-gray-400">Remaining</p>
              </div>
            </div>

            {/* Today's mini-progress */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-600">
                  Today&apos;s Activities
                </span>
                <span className="text-[11px] text-gray-400">
                  {todayCompleted}/{todayTotal}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]"
                  initial={{ width: 0 }}
                  animate={{ width: todayTotal > 0 ? `${(todayCompleted / todayTotal) * 100}%` : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Timeline-Style Day Navigation ── */}
      <div className="px-4 pb-2">
        <div className="relative">
          {/* Horizontal timeline line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 z-0" />
          <div className="flex gap-0 overflow-x-auto pb-2 scrollbar-hide relative z-10">
            {days.map((day) => {
              const dayActivities = day.activities
              const dayCompleted = dayActivities.filter(
                (a) => (localActivities[a.id] || a.status) === 'completed'
              ).length
              const isAllDone = dayActivities.length > 0 && dayCompleted === dayActivities.length
              const isActive = day.dayNumber === selectedDay
              const isCurrentTravelDay = day.dayNumber === currentTravelDay

              return (
                <motion.button
                  key={day.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(day.dayNumber)}
                  className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl transition-all min-w-[56px] ${
                    isActive
                      ? 'bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] text-white shadow-md'
                      : isAllDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCurrentTravelDay
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-100'
                  }`}
                >
                  <span className="text-[10px] font-medium opacity-80">Day</span>
                  <span className="text-lg font-bold leading-tight">{day.dayNumber}</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {isAllDone && !isActive && (
                      <CheckCircle2 className="size-3 text-emerald-500" />
                    )}
                    {isCurrentTravelDay && !isActive && !isAllDone && (
                      <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  {/* Mini completion bar */}
                  {dayActivities.length > 0 && !isActive && (
                    <div className="w-full max-w-[40px] h-0.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isAllDone ? 'bg-emerald-400' : 'bg-[#FF8C42]'}`}
                        style={{ width: `${(dayCompleted / dayActivities.length) * 100}%` }}
                      />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Day Title ── */}
      {currentDay && (
        <div className="px-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-800">{currentDay.title}</h3>
          {currentDay.route && (
            <p className="text-xs text-gray-400 mt-0.5">Route: {currentDay.route}</p>
          )}
        </div>
      )}

      {/* ── Live Location Map ── */}
      <div className="px-4 py-2">
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-1.5 px-3.5 pt-3 pb-2">
              <Navigation className="size-3.5 text-[#FF6B6B]" />
              <span className="text-xs font-semibold text-gray-700">Live Location</span>
              <Badge variant="secondary" className="h-4 text-[9px] px-1.5 bg-[#2EC4B6]/10 text-[#2EC4B6] ml-auto">
                <Eye className="size-2.5 mr-0.5" />
                Live
              </Badge>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
              <iframe
                title="Live Location Map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLocation.lng - 0.03}%2C${mapLocation.lat - 0.02}%2C${mapLocation.lng + 0.03}%2C${mapLocation.lat + 0.02}&layer=mapnik&marker=${mapLocation.lat}%2C${mapLocation.lng}`}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
              />
            </div>
            <div className="px-3.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MapPin className="size-3 text-[#FF8C42]" />
                <span className="text-[11px] text-gray-500">{mapLocation.label}</span>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${mapLocation.lat}&mlon=${mapLocation.lng}#map=${mapLocation.zoom}/${mapLocation.lat}/${mapLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#FF8C42] font-medium hover:underline"
              >
                Open in Maps →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Route Map Placeholder - Visual Timeline ── */}
      {activities.length > 0 && (
        <div className="px-4 py-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="size-3.5 text-[#FF6B6B]" />
              <span className="text-xs font-medium text-gray-700">
                Day {selectedDay} Route
              </span>
            </div>
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {activities.map((activity, index) => {
                const status = getStatus(activity)
                const isCompleted = status === 'completed'
                const isSkipped = status === 'skipped'

                return (
                  <div key={activity.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-5 rounded-full border-2 flex items-center justify-center ${
                          isCompleted
                            ? 'border-emerald-400 bg-emerald-400'
                            : isSkipped
                              ? 'border-gray-300 bg-gray-300'
                              : 'border-[#FF8C42] bg-white'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="size-3 text-white" />}
                        {isSkipped && <SkipForward className="size-2.5 text-white" />}
                        {!isCompleted && !isSkipped && (
                          <div className="size-1.5 rounded-full bg-[#FF8C42]" />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 max-w-[60px] text-center truncate">
                        {activity.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                    {index < activities.length - 1 && (
                      <div
                        className={`w-8 h-0.5 mx-0.5 mb-4 ${
                          getStatus(activities[index + 1]) === 'completed' && isCompleted
                            ? 'bg-emerald-300'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Activities List ── */}
      <div className="px-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center"
            >
              <Clock className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No activities planned for this day</p>
            </motion.div>
          ) : (
            activities.map((activity, index) => {
              const status = getStatus(activity)
              const isCompleted = status === 'completed'
              const isSkipped = status === 'skipped'
              const statusBadge = getStatusBadge(status)
              const isBeingUpdated = isUpdating === activity.id

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card
                    className={`border-gray-100 shadow-sm overflow-hidden transition-all ${
                      isCompleted ? 'bg-emerald-50/30 border-emerald-100' : ''
                    } ${isSkipped ? 'bg-gray-50/50' : ''}`}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-3">
                        {/* Time Column */}
                        <div className="flex-shrink-0 text-right min-w-[48px]">
                          <p className="text-xs font-medium text-gray-900">
                            {formatTime(activity.startTime)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatTime(activity.endTime)}
                          </p>
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4
                                className={`text-sm font-semibold ${
                                  isCompleted
                                    ? 'text-emerald-700 line-through opacity-70'
                                    : isSkipped
                                      ? 'text-gray-400 line-through'
                                      : 'text-gray-900'
                                }`}
                              >
                                {activity.title}
                              </h4>
                              {activity.location && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="size-3 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-500 truncate">
                                    {activity.location}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 px-1.5 flex-shrink-0 ${statusBadge.bgClass}`}
                            >
                              {statusBadge.label}
                            </Badge>
                          </div>

                          {/* Cost */}
                          {activity.cost > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Wallet className="size-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Est. {formatCurrency(activity.cost, currency)}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {!isCompleted && !isSkipped && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3"
                                disabled={isBeingUpdated}
                                onClick={() => updateActivityStatus(activity.id, 'completed')}
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-3"
                                disabled={isBeingUpdated}
                                onClick={() => updateActivityStatus(activity.id, 'skipped')}
                              >
                                <SkipForward className="size-3 mr-1" />
                                Skip
                              </Button>
                            </div>
                          )}

                          {/* Undo for completed/skipped */}
                          {(isCompleted || isSkipped) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] text-gray-400 hover:text-gray-600 px-0 mt-1"
                              disabled={isBeingUpdated}
                              onClick={() => updateActivityStatus(activity.id, 'pending')}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── Budget Quick View ── */}
      <div className="px-4 mt-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg bg-[#FF8C42]/10 flex items-center justify-center">
                  <Wallet className="size-4 text-[#FF8C42]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Spent Today</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(todaySpent, currency)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Budget</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(totalBudget, currency)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#FF8C42] hover:text-[#FF8C42] hover:bg-[#FF8C42]/10 text-xs gap-1 h-8"
                onClick={() => setCurrentView('budget-tracker')}
              >
                View Full Budget
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
