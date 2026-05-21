'use client'

import { useState, useMemo } from 'react'
import { Calendar, Plane, PlaneLanding, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export default function StepTravelDates() {
  const { wizardData, setWizardData } = useAppStore()
  const [activeField, setActiveField] = useState<'departure' | 'return' | null>(null)

  const handleDateChange = (field: 'departureDate' | 'returnDate', value: string) => {
    setWizardData({ [field]: value })
  }

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
        <h2 className="text-xl font-bold text-foreground mb-1">
          When is your trip?
        </h2>
        <p className="text-sm text-muted-foreground">
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
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className={`size-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
            activeField === 'departure' 
              ? 'bg-[#2F5C9B]/20 scale-110' 
              : 'bg-[#2F5C9B]/10'
          }`}>
            <Plane className={`size-4 transition-colors duration-200 ${
              activeField === 'departure' ? 'text-[#2F5C9B]' : 'text-[#2F5C9B]'
            }`} />
          </div>
          <div>
            <span>Departure Date</span>
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">When does your trip begin?</span>
          </div>
        </label>
        <div className="relative group">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-all duration-200 ${
            activeField === 'departure' 
              ? 'text-[#2F5C9B] scale-110' 
              : 'text-[#2F5C9B]'
          }`}>
            <Calendar className="size-5" />
          </div>
          <Input
            type="date"
            min={minDate}
            value={wizardData.departureDate}
            onChange={(e) => handleDateChange('departureDate', e.target.value)}
            onFocus={() => setActiveField('departure')}
            onBlur={() => setActiveField(null)}
            className={`pl-12 h-14 rounded-xl border-2 transition-all duration-200 text-base font-medium ${
              activeField === 'departure'
                ? 'border-[#2F5C9B] ring-4 ring-[#2F5C9B]/20 bg-[#2F5C9B]/5 shadow-lg shadow-[#2F5C9B]/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {wizardData.departureDate && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-6 rounded-full bg-[#2F5C9B] flex items-center justify-center animate-in zoom-in duration-200">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          )}
        </div>
        {wizardData.departureDate && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2F5C9B]/5 border border-[#2F5C9B]/10"
          >
            <div className="size-1.5 rounded-full bg-[#2F5C9B] animate-pulse" />
            <p className="text-xs text-[#2F5C9B] font-medium">
              {formatDate(wizardData.departureDate)}
            </p>
          </motion.div>
        )}
      </div>

      {/* Return Date */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className={`size-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
            activeField === 'return' 
              ? 'bg-[#5CA5CD]/20 scale-110' 
              : 'bg-[#5CA5CD]/10'
          }`}>
            <PlaneLanding className={`size-4 transition-colors duration-200 ${
              activeField === 'return' ? 'text-[#5CA5CD]' : 'text-[#5CA5CD]'
            }`} />
          </div>
          <div>
            <span>Return Date</span>
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">When do you come back?</span>
          </div>
        </label>
        <div className="relative group">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-all duration-200 ${
            activeField === 'return' 
              ? 'text-[#5CA5CD] scale-110' 
              : 'text-[#5CA5CD]'
          }`}>
            <Calendar className="size-5" />
          </div>
          <Input
            type="date"
            min={wizardData.departureDate || minDate}
            value={wizardData.returnDate}
            onChange={(e) => handleDateChange('returnDate', e.target.value)}
            onFocus={() => setActiveField('return')}
            onBlur={() => setActiveField(null)}
            className={`pl-12 h-14 rounded-xl border-2 transition-all duration-200 text-base font-medium ${
              activeField === 'return'
                ? 'border-[#5CA5CD] ring-4 ring-[#5CA5CD]/20 bg-[#5CA5CD]/5 shadow-lg shadow-[#5CA5CD]/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {wizardData.returnDate && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-6 rounded-full bg-[#5CA5CD] flex items-center justify-center animate-in zoom-in duration-200">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          )}
        </div>
        {wizardData.returnDate && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#5CA5CD]/5 border border-[#5CA5CD]/10"
          >
            <div className="size-1.5 rounded-full bg-[#5CA5CD] animate-pulse" />
            <p className="text-xs text-[#5CA5CD] font-medium">
              {formatDate(wizardData.returnDate)}
            </p>
          </motion.div>
        )}
      </div>

      {/* Trip Duration Display */}
      {tripDuration > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 border border-[#5CA5CD]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {tripDuration} {tripDuration === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-muted-foreground">Trip Duration</p>
            </div>
            <Badge className="bg-[#5CA5CD]/10 text-[#5CA5CD] border-0">
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
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                <p className="text-xs text-muted-foreground">{preset.days} days</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
