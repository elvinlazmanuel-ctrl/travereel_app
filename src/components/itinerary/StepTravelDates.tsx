'use client'

import { useMemo } from 'react'
import { Calendar, Plane, PlaneLanding, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function StepTravelDates() {
  const { wizardData, setWizardData } = useAppStore()

  // Calculate trip duration
  const tripDuration = useMemo(() => {
    if (wizardData.departureDate && wizardData.returnDate) {
      const departure = new Date(wizardData.departureDate)
      const returnDate = new Date(wizardData.returnDate)
      const diffTime = returnDate.getTime() - departure.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }
    return 0
  }, [wizardData.departureDate, wizardData.returnDate])

  // Check if dates are valid
  const isValidDates = useMemo(() => {
    if (!wizardData.departureDate || !wizardData.returnDate) return true
    const departure = new Date(wizardData.departureDate)
    const returnDate = new Date(wizardData.returnDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Departure must be in the future
    if (departure < today) return false
    // Return must be after departure
    if (returnDate <= departure) return false
    
    return true
  }, [wizardData.departureDate, wizardData.returnDate])

  // Calculate days until departure
  const daysUntilDeparture = useMemo(() => {
    if (!wizardData.departureDate) return null
    const departure = new Date(wizardData.departureDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = departure.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 ? diffDays : null
  }, [wizardData.departureDate])

  // Reminder info
  const reminderInfo = useMemo(() => {
    if (daysUntilDeparture === null) return null
    const oneWeekBefore = daysUntilDeparture - 7
    
    if (oneWeekBefore <= 0) {
      return {
        message: 'Less than 1 week until departure!',
        urgent: true
      }
    }
    
    return {
      message: `Reminder will be shown ${oneWeekBefore} days before departure`,
      urgent: false
    }
  }, [daysUntilDeparture])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          When is your trip?
        </h2>
        <p className="text-sm text-gray-500">
          Set your departure and return dates
        </p>
      </div>

      {/* Date Validation Error */}
      {!isValidDates && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Invalid dates</p>
            <p className="text-xs text-red-600 mt-0.5">
              {!wizardData.departureDate || !wizardData.returnDate 
                ? 'Please select both dates'
                : new Date(wizardData.departureDate) < new Date()
                ? 'Departure date must be in the future'
                : 'Return date must be after departure date'}
            </p>
          </div>
        </div>
      )}

      {/* Departure Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Plane className="size-4 inline mr-1.5 -mt-0.5" />
          Departure Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="date"
            min={minDate}
            value={wizardData.departureDate}
            onChange={(e) => setWizardData({ departureDate: e.target.value })}
            className="pl-10 h-12"
          />
        </div>
        {wizardData.departureDate && (
          <p className="text-xs text-gray-500 mt-1.5">
            {formatDate(wizardData.departureDate)}
          </p>
        )}
      </div>

      {/* Return Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <PlaneLanding className="size-4 inline mr-1.5 -mt-0.5" />
          Return Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="date"
            min={wizardData.departureDate || minDate}
            value={wizardData.returnDate}
            onChange={(e) => setWizardData({ returnDate: e.target.value })}
            className="pl-10 h-12"
          />
        </div>
        {wizardData.returnDate && (
          <p className="text-xs text-gray-500 mt-1.5">
            {formatDate(wizardData.returnDate)}
          </p>
        )}
      </div>

      {/* Trip Duration Display */}
      {tripDuration > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#2EC4B6]/5 to-[#FFBA49]/5 border border-[#2EC4B6]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {tripDuration} {tripDuration === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-gray-500">Trip Duration</p>
            </div>
            <Badge className="bg-[#2EC4B6]/10 text-[#2EC4B6] border-0">
              {wizardData.departureDate && formatDate(wizardData.departureDate)}
            </Badge>
          </div>
        </div>
      )}

      {/* Days Until Departure */}
      {daysUntilDeparture !== null && daysUntilDeparture > 0 && (
        <div className={`p-4 rounded-xl border ${
          daysUntilDeparture <= 7 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <Calendar className={`size-5 ${
              daysUntilDeparture <= 7 ? 'text-orange-500' : 'text-blue-500'
            }`} />
            <div>
              <p className={`text-sm font-semibold ${
                daysUntilDeparture <= 7 ? 'text-orange-800' : 'text-blue-800'
              }`}>
                {daysUntilDeparture === 0 
                  ? 'Departing today!' 
                  : daysUntilDeparture === 1 
                  ? 'Departing tomorrow' 
                  : `${daysUntilDeparture} days until departure`}
              </p>
              <p className={`text-xs ${
                daysUntilDeparture <= 7 ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {daysUntilDeparture <= 7 
                  ? 'Time to finalize your preparations!' 
                  : 'Your adventure is coming up'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Information */}
      {reminderInfo && daysUntilDeparture !== null && daysUntilDeparture > 7 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Trip Reminder</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {reminderInfo.message}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              You'll be notified about requirements (visa, passport, vaccinations, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Quick Date Presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Quick Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Weekend Trip', days: 3, emoji: '🌟' },
            { label: 'Week Getaway', days: 7, emoji: '🏖️' },
            { label: 'Extended Stay', days: 14, emoji: '🌍' },
            { label: 'Long Adventure', days: 30, emoji: '✈️' },
          ].map((preset) => {
            const today = new Date()
            const departure = new Date(today)
            departure.setDate(departure.getDate() + 14) // Default 2 weeks from now
            const returnDate = new Date(departure)
            returnDate.setDate(returnDate.getDate() + preset.days)
            
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setWizardData({
                    departureDate: departure.toISOString().split('T')[0],
                    returnDate: returnDate.toISOString().split('T')[0],
                  })
                }}
                className="p-3 rounded-xl border-2 border-transparent hover:border-gray-200 bg-gray-50 transition-all text-left"
              >
                <span className="text-xl">{preset.emoji}</span>
                <p className="text-sm font-semibold text-gray-800 mt-1">{preset.label}</p>
                <p className="text-xs text-gray-500">{preset.days} days</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
