'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, MapPin, Calendar, DollarSign, Award, Clock, Globe, Star, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface TravelStats {
  totalTrips: number
  totalCountries: number
  totalCities: number
  totalDays: number
  totalSpent: number
  favoriteCountry: string | null
  favoriteCity: string | null
  longestTrip: number
  shortestTrip: number
  travelStreak: number
  firstTripDate: Date | string | null
  lastTripDate: Date | string | null
  countriesVisited: string[]
  citiesVisited: string[]
}

interface TravelStatsDashboardProps {
  userId: string
}

export function TravelStatsDashboard({ userId }: TravelStatsDashboardProps) {
  const [stats, setStats] = useState<TravelStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch from API - will calculate from itineraries
        const response = await fetch(`/api/users/${userId}/travel-stats`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch travel stats:', error)
        // Fallback: calculate client-side
        calculateStatsFromItineraries()
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  const calculateStatsFromItineraries = async () => {
    try {
      const response = await fetch(`/api/itineraries?authorId=${userId}`)
      if (response.ok) {
        const itineraries = await response.json()
        
        const countries = new Set<string>()
        const cities = new Set<string>()
        let totalDays = 0
        let totalSpent = 0
        let longestTrip = 0
        let shortestTrip = Infinity
        let firstTrip: Date | null = null
        let lastTrip: Date | null = null

        itineraries.forEach((itinerary: any) => {
          countries.add(itinerary.country)
          cities.add(itinerary.location)
          totalDays += itinerary.days || 0
          totalSpent += itinerary.budget || 0

          if (itinerary.days > longestTrip) longestTrip = itinerary.days
          if (itinerary.days < shortestTrip && itinerary.days > 0) shortestTrip = itinerary.days

          const depDate = itinerary.departureDate ? new Date(itinerary.departureDate) : null
          if (depDate) {
            if (!firstTrip || depDate < firstTrip) firstTrip = depDate
            if (!lastTrip || depDate > lastTrip) lastTrip = depDate
          }
        })

        if (shortestTrip === Infinity) shortestTrip = 0

        setStats({
          totalTrips: itineraries.length,
          totalCountries: countries.size,
          totalCities: cities.size,
          totalDays,
          totalSpent,
          favoriteCountry: null, // Would need more complex calculation
          favoriteCity: null,
          longestTrip,
          shortestTrip,
          travelStreak: calculateStreak(itineraries),
          firstTripDate: firstTrip,
          lastTripDate: lastTrip,
          countriesVisited: Array.from(countries),
          citiesVisited: Array.from(cities),
        })
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const calculateStreak = (itineraries: any[]): number => {
    const years = new Set<number>()
    itineraries.forEach((itinerary: any) => {
      if (itinerary.departureDate) {
        years.add(new Date(itinerary.departureDate).getFullYear())
      }
    })
    return years.size
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-[#2F5C9B] mb-3" />
          <p className="text-sm text-gray-500">Loading your travel stats...</p>
        </div>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <MapPin className="size-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No trips yet</h3>
          <p className="text-sm text-gray-500">Start planning your first itinerary to see your travel stats!</p>
        </div>
      </Card>
    )
  }

  const statCards = [
    {
      label: 'Total Trips',
      value: stats.totalTrips,
      icon: MapPin,
      color: 'from-[#2F5C9B] to-[#5CA5CD]',
      bgColor: 'bg-[#2F5C9B]/10',
    },
    {
      label: 'Countries',
      value: stats.totalCountries,
      icon: Globe,
      color: 'from-[#5CA5CD] to-[#16B5A8]',
      bgColor: 'bg-[#5CA5CD]/10',
    },
    {
      label: 'Cities',
      value: stats.totalCities,
      icon: MapPin,
      color: 'from-[#E58BEA] to-[#FFA500]',
      bgColor: 'bg-[#E58BEA]/10',
    },
    {
      label: 'Total Days',
      value: stats.totalDays,
      icon: Calendar,
      color: 'from-[#9B5DE5] to-[#7B3FC3]',
      bgColor: 'bg-[#9B5DE5]/10',
    },
    {
      label: 'Budget Spent',
      value: `$${stats.totalSpent.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-[#00BBF9] to-[#0099CC]',
      bgColor: 'bg-[#00BBF9]/10',
    },
    {
      label: 'Travel Streak',
      value: `${stats.travelStreak} ${stats.travelStreak === 1 ? 'Year' : 'Years'}`,
      icon: TrendingUp,
      color: 'from-[#FEE440] to-[#FFD700]',
      bgColor: 'bg-[#FEE440]/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <Award className="size-6 text-[#E58BEA]" />
          <h2 className="text-2xl font-bold text-gray-900">Your Travel Journey</h2>
        </div>
        {stats.firstTripDate && (
          <p className="text-sm text-gray-500">
            Traveling since {new Date(stats.firstTripDate).getFullYear()}
          </p>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`size-5 text-${stat.color.split(' ')[1]}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trip Records */}
      {(stats.longestTrip > 0 || stats.shortestTrip > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="size-4 text-[#2F5C9B]" />
              Trip Records
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#2F5C9B]/5 to-[#5CA5CD]/5 border border-[#2F5C9B]/10">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longest Trip</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.longestTrip} days</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#5CA5CD]/5 to-[#16B5A8]/5 border border-[#5CA5CD]/10">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shortest Trip</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.shortestTrip} days</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Countries & Cities Visited */}
      {(stats.countriesVisited.length > 0 || stats.citiesVisited.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Star className="size-4 text-[#E58BEA]" />
              Destinations
            </h3>
            
            {stats.countriesVisited.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Countries</p>
                <div className="flex flex-wrap gap-2">
                  {stats.countriesVisited.map((country) => (
                    <Badge
                      key={country}
                      variant="secondary"
                      className="bg-[#5CA5CD]/10 text-[#5CA5CD] hover:bg-[#5CA5CD]/20"
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {stats.citiesVisited.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Cities</p>
                <div className="flex flex-wrap gap-2">
                  {stats.citiesVisited.slice(0, 10).map((city) => (
                    <Badge
                      key={city}
                      variant="secondary"
                      className="bg-[#E58BEA]/10 text-[#E58BEA] hover:bg-[#E58BEA]/20"
                    >
                      {city}
                    </Badge>
                  ))}
                  {stats.citiesVisited.length > 10 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      +{stats.citiesVisited.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}
