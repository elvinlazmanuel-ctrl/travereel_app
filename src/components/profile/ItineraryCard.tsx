'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar, Wallet, Clock, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type Itinerary } from '@/lib/store'

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

function getStatusConfig(status: Itinerary['status']) {
  switch (status) {
    case 'pre-travel':
      return {
        label: 'Pre-Travel',
        bgClass: 'bg-amber-100 text-amber-700 border-amber-200',
      }
    case 'during-travel':
      return {
        label: 'During Travel',
        bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      }
    case 'post-travel':
      return {
        label: 'Post-Travel',
        bgClass: 'bg-[#2F5C9B]/15 text-[#2F5C9B] border-[#2F5C9B]/25',
      }
    default:
      return {
        label: 'Unknown',
        bgClass: 'bg-gray-100 text-gray-600 border-gray-200',
      }
  }
}

function formatBudget(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ItineraryCardProps {
  itinerary: Itinerary
  index?: number
}

export default function ItineraryCard({ itinerary, index = 0 }: ItineraryCardProps) {
  const { setSelectedItinerary, setCurrentView } = useAppStore()
  const statusConfig = getStatusConfig(itinerary.status)
  const flag = getCountryFlag(itinerary.country)

  const handleClick = () => {
    setSelectedItinerary(itinerary)
    setCurrentView('itinerary-detail')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleClick}
      className="bg-white rounded-xl border border-gray-100 p-3.5 cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        {/* Flag & Icon */}
        <div className="flex-shrink-0 size-11 rounded-lg bg-gray-50 flex items-center justify-center text-xl">
          {flag}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {itinerary.title}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {itinerary.location}
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-300 flex-shrink-0 mt-0.5" />
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-3 mt-2.5">
            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 border ${statusConfig.bgClass}`}
            >
              {statusConfig.label}
            </Badge>

            {/* Days */}
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-gray-400" />
              <span className="text-xs text-muted-foreground">{itinerary.days}d</span>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-1">
              <Wallet className="size-3 text-gray-400" />
              <span className="text-xs text-muted-foreground">
                {formatBudget(itinerary.budget, itinerary.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
