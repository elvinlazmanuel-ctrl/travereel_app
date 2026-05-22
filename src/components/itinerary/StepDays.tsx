'use client'

import { useEffect, useMemo } from 'react'
import { CalendarDays, Clock, Wallet, MapPin, Plane, PlaneLanding, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function StepDays() {
  const { wizardData, setWizardData } = useAppStore()
  
  // Calculate trip duration from selected dates
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

  // Automatically sync calculated duration to wizardData.days
  useEffect(() => {
    if (tripDuration > 0 && tripDuration !== wizardData.days) {
      setWizardData({ days: tripDuration })
    }
  }, [tripDuration, wizardData.days, setWizardData])
  
  // Use calculated duration or fallback to wizardData.days
  const days = tripDuration > 0 ? tripDuration : wizardData.days
  
  // Calculate budget metrics
  const perDayBudget = wizardData.budget > 0 && days > 0 ? wizardData.budget / days : 0
  const perHourBudget = days > 0 ? perDayBudget / 24 : 0

  const currencySymbol = (code: string) => {
    const map: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', PHP: '₱',
      THB: '฿', KRW: '₩', AUD: 'A$', CAD: 'C$', SGD: 'S$',
      INR: '₹', BRL: 'R$', MXN: 'Mex$', IDR: 'Rp', VND: '₫',
      NZD: 'NZ$', CHF: 'Fr', SEK: 'kr', NOK: 'kr', AED: 'د.إ',
      TWD: 'NT$',
    }
    return map[code] || code
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate nights
  const nights = days > 0 ? days - 1 : 0

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Trip Duration
        </h2>
        <p className="text-sm text-muted-foreground">
          {days > 0 
            ? `Your trip is ${days} ${days === 1 ? 'day' : 'days'} long` 
            : 'Select travel dates to calculate duration'}
        </p>
      </div>

      {/* No dates selected warning */}
      {days === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            ⚠️ Please select your travel dates in the previous step to automatically calculate trip duration.
          </p>
        </div>
      )}

      {/* Main Duration Display */}
      {days > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center py-6"
        >
          <div className="text-7xl font-bold bg-gradient-to-r from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] bg-clip-text text-transparent">
            {days}
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            {days === 1 ? 'Day' : 'Days'} • {nights} {nights === 1 ? 'Night' : 'Nights'}
          </p>
        </motion.div>
      )}

      {/* Date Range Display */}
      {wizardData.departureDate && wizardData.returnDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#2F5C9B]/5 to-[#5CA5CD]/5 border border-[#2F5C9B]/20">
            <Plane className="size-5 text-[#2F5C9B]" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Departure</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(wizardData.departureDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 border border-[#5CA5CD]/20">
            <PlaneLanding className="size-5 text-[#5CA5CD]" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Return</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(wizardData.returnDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Breakdown */}
      {perDayBudget > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Budget Breakdown
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#E58BEA]/5 to-[#5CA5CD]/5 border border-[#E58BEA]/20">
              <Wallet className="size-5 text-[#E58BEA] mb-2" />
              <p className="text-xs text-muted-foreground">Per Day</p>
              <p className="text-xl font-bold text-foreground">
                {currencySymbol(wizardData.currency)}{perDayBudget.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {wizardData.currency}/day
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 border border-[#5CA5CD]/20">
              <Clock className="size-5 text-[#5CA5CD] mb-2" />
              <p className="text-xs text-muted-foreground">Per Hour</p>
              <p className="text-xl font-bold text-foreground">
                {currencySymbol(wizardData.currency)}{perHourBudget.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {wizardData.currency}/hour
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trip Overview Statistics */}
      {days > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Trip Overview
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <CalendarDays className="size-5 text-[#2F5C9B] mx-auto mb-1" />
                <p className="text-2xl font-bold text-[#2F5C9B]">{days}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Days</p>
              </div>
              <div>
                <MapPin className="size-5 text-[#5CA5CD] mx-auto mb-1" />
                <p className="text-2xl font-bold text-[#5CA5CD]">{days * 2}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Activities</p>
              </div>
              <div>
                <TrendingUp className="size-5 text-[#5CA5CD] mx-auto mb-1" />
                <p className="text-2xl font-bold text-[#5CA5CD]">{days * 3}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Experiences</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Day Blocks */}
      {days > 0 && days <= 30 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Trip Timeline
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: Math.min(days, 30) }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className="size-9 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, #2F5C9B, #5CA5CD)'
                    : i === days - 1
                    ? 'linear-gradient(135deg, #5CA5CD, #E58BEA)'
                    : '#f3f4f6',
                  color: i === 0 || i === days - 1 ? 'white' : '#6b7280',
                }}
              >
                {i + 1}
              </motion.div>
            ))}
            {days > 30 && (
              <div className="size-9 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">
                +{days - 30}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD]" />
              <span className="text-[10px] text-gray-400">Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-gradient-to-r from-[#5CA5CD] to-[#E58BEA]" />
              <span className="text-[10px] text-gray-400">End</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
