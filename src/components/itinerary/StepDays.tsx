'use client'

import { Minus, Plus, CalendarDays, Clock, Wallet } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const quickSelectDays = [1, 3, 5, 7, 10, 14]

export default function StepDays() {
  const { wizardData, setWizardData } = useAppStore()
  const days = wizardData.days
  const perDayBudget = wizardData.budget > 0 && days > 0 ? wizardData.budget / days : 0

  const currencySymbol = (code: string) => {
    const map: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', PHP: '₱',
      THB: '฿', KRW: '₩', AUD: 'A$', CAD: 'C$', SGD: 'S$',
      INR: '₹', BRL: 'R$', MXN: 'Mex$', IDR: 'Rp', VND: '₫',
      NZD: 'NZ$', CHF: 'Fr', SEK: 'kr', NOK: 'kr', AED: 'د.إ',
    }
    return map[code] || code
  }

  const adjustDays = (delta: number) => {
    const newDays = Math.max(1, Math.min(30, days + delta))
    setWizardData({ days: newDays })
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          How many days is your trip?
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose the duration of your adventure
        </p>
      </div>

      {/* Days Counter */}
      <div className="flex items-center justify-center gap-6 py-4">
        <Button
          variant="outline"
          size="icon"
          className="size-14 rounded-full border-2 border-gray-200 hover:border-[#FF6B6B] hover:bg-[#FF6B6B]/5"
          onClick={() => adjustDays(-1)}
          disabled={days <= 1}
        >
          <Minus className="size-6" />
        </Button>
        <div className="text-center">
          <motion.div
            key={days}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-6xl font-bold bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] bg-clip-text text-transparent"
          >
            {days}
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">
            {days === 1 ? 'Day' : 'Days'}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-14 rounded-full border-2 border-gray-200 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5"
          onClick={() => adjustDays(1)}
          disabled={days >= 30}
        >
          <Plus className="size-6" />
        </Button>
      </div>

      {/* Quick Select */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Select
        </p>
        <div className="flex flex-wrap gap-2">
          {quickSelectDays.map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWizardData({ days: d })}
              className={
                days === d
                  ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white border-0 hover:opacity-90'
                  : 'border-gray-200 hover:border-[#FF8C42] hover:text-[#FF8C42]'
              }
            >
              {d === 1 ? '1 Day' : `${d} Days`}
            </Button>
          ))}
        </div>
      </div>

      {/* Visual Day Blocks */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Trip Overview
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: days }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
              className="size-9 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: i === 0
                  ? 'linear-gradient(135deg, #FF6B6B, #FF8C42)'
                  : i === days - 1
                  ? 'linear-gradient(135deg, #2EC4B6, #FFBA49)'
                  : '#f3f4f6',
                color: i === 0 || i === days - 1 ? 'white' : '#6b7280',
              }}
            >
              {i + 1}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42]" />
            <span className="text-[10px] text-gray-400">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded bg-gradient-to-r from-[#2EC4B6] to-[#FFBA49]" />
            <span className="text-[10px] text-gray-400">End</span>
          </div>
        </div>
      </div>

      {/* Per Day Budget Estimate */}
      {perDayBudget > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#FFBA49]/5 to-[#FF8C42]/5 border border-[#FFBA49]/20">
            <Wallet className="size-5 text-[#FFBA49]" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Budget per day</p>
              <p className="text-lg font-bold text-foreground">
                {currencySymbol(wizardData.currency)}{perDayBudget.toFixed(0)} {wizardData.currency}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#2EC4B6]/5 to-[#FFBA49]/5 border border-[#2EC4B6]/20">
            <Clock className="size-5 text-[#2EC4B6]" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total duration</p>
              <p className="text-lg font-bold text-foreground">
                {days} {days === 1 ? 'day' : 'days'}, {days - 1} {days - 1 === 1 ? 'night' : 'nights'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Visual */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="size-4 text-gray-400" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Summary
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-[#FF6B6B]">{days}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF8C42]">{days * 3}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2EC4B6]">{days * 2}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Meals</p>
          </div>
        </div>
      </div>
    </div>
  )
}
