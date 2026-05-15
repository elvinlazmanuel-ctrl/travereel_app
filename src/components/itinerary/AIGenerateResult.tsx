'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  MapPin,
  Wallet,
  RefreshCw,
  Pencil,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Route,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIDay {
  dayNumber: number
  title: string
  description: string
  activities: {
    title: string
    description: string
    location: string
    startTime: string
    endTime: string
    cost: number
  }[]
  route: string
}

interface AIResult {
  days: AIDay[]
  requirements: string[]
  totalEstimatedCost: number
}

export default function AIGenerateResult() {
  const { wizardData, currentUser, addItinerary, setCurrentView, resetWizard, setIsAIGenerate } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AIResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTimeout, setIsTimeout] = useState(false)
  const [expandedDay, setExpandedDay] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const generateItinerary = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setIsTimeout(false)
    setElapsedTime(0)

    // Start elapsed time counter
    const startTime = Date.now()
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    try {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: wizardData.country,
          location: wizardData.location,
          budget: wizardData.budget,
          days: wizardData.days,
          activities: wizardData.activities,
          travelType: wizardData.travelType,
          departureDate: wizardData.departureDate,
          returnDate: wizardData.returnDate,
          departureTime: wizardData.departureTime,
          arrivalTime: wizardData.arrivalTime,
          hasHotel: wizardData.hasHotel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a timeout error
        if (data.timeout) {
          setIsTimeout(true)
        }
        throw new Error(data.error || 'Failed to generate itinerary')
      }

      setResult(data.itinerary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      clearInterval(timerInterval)
      setLoading(false)
    }
  }, [wizardData])

  useEffect(() => {
    generateItinerary()
  }, [generateItinerary])

  const handleSave = async () => {
    if (!result || !currentUser) return
    setSaving(true)

    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: wizardData.title || `${wizardData.location} Trip`,
          country: wizardData.country,
          location: wizardData.location,
          departureDate: wizardData.departureDate || null,
          returnDate: wizardData.returnDate || null,
          budget: wizardData.budget,
          currency: wizardData.currency,
          days: wizardData.days,
          travelType: wizardData.travelType,
          activities: wizardData.activities,
          isPublic: false,
          requirements: result.requirements,
          authorId: currentUser.id,
          daysPlan: result.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            route: day.route,
            activities: day.activities.map((activity, index) => ({
              title: activity.title,
              description: activity.description,
              location: activity.location,
              startTime: activity.startTime,
              endTime: activity.endTime,
              cost: activity.cost,
              order: index,
            })),
          })),
          budgetItems: [],
          companions: wizardData.companions.map((c) => ({
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
      // Silently handle error
    } finally {
      setSaving(false)
    }
  }

  const handleSwitchToManual = () => {
    setIsAIGenerate(false)
  }

  const budgetRemaining = wizardData.budget - (result?.totalEstimatedCost || 0)
  const currencySymbol = (code: string) => {
    const map: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', PHP: '₱',
      THB: '฿', KRW: '₩', AUD: 'A$', CAD: 'C$', SGD: 'S$',
      INR: '₹', BRL: 'R$', MXN: 'Mex$', IDR: 'Rp', VND: '₫',
      NZD: 'NZ$', CHF: 'Fr', SEK: 'kr', NOK: 'kr', AED: 'د.إ',
    }
    return map[code] || code
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="size-16 rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] p-1 mb-6"
        >
          <div className="size-full rounded-full bg-white flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </motion.div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          AI is planning your trip...
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-[250px]">
          Creating a personalized itinerary for {wizardData.location}, {wizardData.country}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-4 text-[#FF8C42]" />
          <span className="text-sm font-medium text-gray-700">
            {elapsedTime}s elapsed
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="size-2 rounded-full bg-[#FF8C42]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="size-8 text-[#FF6B6B]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isTimeout ? 'Request Timed Out' : 'Something went wrong'}
        </h3>
        <p className="text-sm text-gray-500 mb-2 text-center max-w-[250px]">
          {isTimeout 
            ? 'The AI service took longer than 60 seconds. Please try again.'
            : error
          }
        </p>
        {isTimeout && (
          <p className="text-xs text-gray-400 mb-6 text-center max-w-[250px]">
            Free AI models may experience delays during peak times. You can retry or switch to manual planning.
          </p>
        )}
        <div className="flex gap-3">
          <Button
            onClick={generateItinerary}
            className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white"
          >
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={handleSwitchToManual}>
            <Pencil className="size-4 mr-2" />
            Plan Manually
          </Button>
        </div>
      </div>
    )
  }

  if (!result) return null

  // Result Display
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Your AI Itinerary</h2>
          <p className="text-xs text-gray-500">
            {wizardData.location}, {wizardData.country} &middot; {wizardData.days} days
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-[#FF6B6B]/5 border border-[#FF6B6B]/10 text-center">
          <p className="text-xs text-gray-500 mb-1">Your Budget</p>
          <p className="text-sm font-bold text-[#FF6B6B]">
            {currencySymbol(wizardData.currency)}{wizardData.budget.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#FF8C42]/5 border border-[#FF8C42]/10 text-center">
          <p className="text-xs text-gray-500 mb-1">Est. Cost</p>
          <p className="text-sm font-bold text-[#FF8C42]">
            ${result.totalEstimatedCost.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl border text-center"
          style={{
            borderColor: budgetRemaining >= 0 ? '#2EC4B6' : '#FF6B6B',
            background: budgetRemaining >= 0 ? 'rgba(46,196,182,0.05)' : 'rgba(255,107,107,0.05)',
          }}
        >
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className={`text-sm font-bold ${budgetRemaining >= 0 ? 'text-[#2EC4B6]' : 'text-[#FF6B6B]'}`}>
            ${budgetRemaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Day-by-Day Cards */}
      <div className="space-y-3">
        {result.days.map((day, index) => (
          <Card
            key={day.dayNumber}
            className="border border-gray-100 overflow-hidden"
          >
            <button
              className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => setExpandedDay(expandedDay === index ? -1 : index)}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-sm"
                style={{
                  background: `linear-gradient(135deg, ${
                    index === 0 ? '#FF6B6B, #FF8C42' : index === result.days.length - 1 ? '#2EC4B6, #FFBA49' : '#FF8C42, #FFBA49'
                  })`,
                }}
              >
                D{day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{day.title}</p>
                <p className="text-xs text-gray-500 truncate">{day.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  {day.activities.length} activities
                </Badge>
                {expandedDay === index ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedDay === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    {/* Route */}
                    {day.route && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-[#2EC4B6]/5 border border-[#2EC4B6]/10">
                        <Route className="size-4 text-[#2EC4B6] shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600">{day.route}</p>
                      </div>
                    )}

                    {/* Activities */}
                    <div className="space-y-2">
                      {day.activities.map((activity, actIndex) => (
                        <div
                          key={actIndex}
                          className="flex gap-3 p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div className="size-2 rounded-full bg-[#FF8C42]" />
                            {actIndex < day.activities.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {activity.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {activity.location && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <MapPin className="size-3" />
                                  {activity.location}
                                </span>
                              )}
                              {activity.startTime && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Clock className="size-3" />
                                  {activity.startTime} - {activity.endTime}
                                </span>
                              )}
                              {activity.cost > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-[#FF8C42] font-medium">
                                  <Wallet className="size-3" />
                                  ${activity.cost}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {/* Requirements */}
      {result.requirements && result.requirements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Requirements & Preparation
          </p>
          <div className="space-y-2">
            {result.requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100"
              >
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">{req}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white h-12 text-base font-semibold"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="size-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <CheckCircle2 className="size-5 mr-2" />
              Accept & Save
            </>
          )}
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={generateItinerary}
            className="flex-1 border-[#FF8C42]/30 text-[#FF8C42] hover:bg-[#FF8C42]/5"
          >
            <RefreshCw className="size-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            onClick={handleSwitchToManual}
            className="flex-1 border-[#2EC4B6]/30 text-[#2EC4B6] hover:bg-[#2EC4B6]/5"
          >
            <Pencil className="size-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
