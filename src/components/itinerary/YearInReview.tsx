'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MapPin, Calendar, TrendingUp, Award, Share2, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface YearInReviewProps {
  userId: string
  year: number
}

interface TravelYearData {
  totalTrips: number
  totalCountries: number
  totalCities: number
  totalDays: number
  totalSpent: number
  topCountry: string
  topCity: string
  longestTrip: {
    destination: string
    days: number
  }
  shortestTrip: {
    destination: string
    days: number
  }
  travelMonths: number[]
  firstTrip: string | null
  lastTrip: string | null
  tripsByMonth: Record<number, number>
}

export function YearInReview({ userId, year }: YearInReviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [data, setData] = useState<TravelYearData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}/year-review?year=${year}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch year in review:', error)
        // Generate sample data
        generateSampleData()
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [userId, year, isOpen])

  const generateSampleData = () => {
    setData({
      totalTrips: 8,
      totalCountries: 5,
      totalCities: 12,
      totalDays: 45,
      totalSpent: 12500,
      topCountry: 'Japan',
      topCity: 'Tokyo',
      longestTrip: {
        destination: 'Thailand',
        days: 14,
      },
      shortestTrip: {
        destination: 'Singapore',
        days: 3,
      },
      travelMonths: [1, 3, 5, 7, 8, 10, 12],
      firstTrip: '2024-01-15',
      lastTrip: '2024-12-20',
      tripsByMonth: { 1: 1, 3: 2, 5: 1, 7: 2, 8: 1, 10: 1, 12: 1 },
    })
  }

  if (!isOpen) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] text-white">
        <div className="text-center">
          <Sparkles className="size-12 mx-auto mb-3 animate-pulse" />
          <h3 className="text-2xl font-bold mb-2">Your {year} in Travel</h3>
          <p className="text-sm opacity-90 mb-4">
            Relive your amazing travel moments from {year}
          </p>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-white text-[#FF6B6B] hover:bg-gray-100"
          >
            View Your Year <ChevronRight className="size-4 ml-2" />
          </Button>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-12 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFBA49] animate-spin mb-3" />
          <p className="text-sm text-gray-500">Preparing your travel story...</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  const slides = [
    // Slide 1: Welcome
    {
      bg: 'from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]',
      content: (
        <div className="text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Sparkles className="size-20 mx-auto mb-6" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold mb-4"
          >
            Your {year}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl opacity-90"
          >
            was extraordinary!
          </motion.p>
        </div>
      ),
    },

    // Slide 2: Total Trips
    {
      bg: 'from-[#2EC4B6] via-[#16B5A8] to-[#0EA5A0]',
      content: (
        <div className="text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center size-24 rounded-full bg-white/20 mb-6"
          >
            <MapPin className="size-12" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4"
          >
            {data.totalTrips}
          </motion.h2>
          <motion.p className="text-2xl opacity-90">
            Adventures Across {data.totalCountries} Countries
          </motion.p>
        </div>
      ),
    },

    // Slide 3: Top Destination
    {
      bg: 'from-[#9B5DE5] via-[#7B3FC3] to-[#6B2FB3]',
      content: (
        <div className="text-center text-white">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg mb-4 opacity-90"
          >
            Your favorite destination was
          </motion.p>
          <motion.h2
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold mb-6"
          >
            {data.topCountry}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full"
          >
            <MapPin className="size-5" />
            <span className="text-lg">{data.topCity}</span>
          </motion.div>
        </div>
      ),
    },

    // Slide 4: Total Days
    {
      bg: 'from-[#00BBF9] via-[#0099CC] to-[#0077AA]',
      content: (
        <div className="text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center size-24 rounded-full bg-white/20 mb-6"
          >
            <Calendar className="size-12" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4"
          >
            {data.totalDays}
          </motion.h2>
          <motion.p className="text-2xl opacity-90">
            Days of Exploration
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm mt-4 opacity-75"
          >
            That's {Math.round(data.totalDays / 365 * 100)}% of your year traveling!
          </motion.p>
        </div>
      ),
    },

    // Slide 5: Budget
    {
      bg: 'from-[#FEE440] via-[#FFD700] to-[#FFC300]',
      content: (
        <div className="text-center text-white">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg mb-4 opacity-90"
          >
            You invested
          </motion.p>
          <motion.h2
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold mb-4"
          >
            ${data.totalSpent.toLocaleString()}
          </motion.h2>
          <motion.p className="text-2xl opacity-90">
            in Unforgettable Memories
          </motion.p>
        </div>
      ),
    },

    // Slide 6: Longest Trip
    {
      bg: 'from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]',
      content: (
        <div className="text-center text-white">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg mb-4 opacity-90"
          >
            Your longest adventure
          </motion.p>
          <motion.h2
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold mb-4"
          >
            {data.longestTrip.destination}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full"
          >
            <Calendar className="size-5" />
            <span className="text-xl">{data.longestTrip.days} Days</span>
          </motion.div>
        </div>
      ),
    },

    // Slide 7: Travel Months
    {
      bg: 'from-[#2EC4B6] via-[#16B5A8] to-[#0EA5A0]',
      content: (
        <div className="text-center text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-6"
          >
            You traveled in {data.travelMonths.length} months
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-2 flex-wrap"
          >
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
              (month, index) => {
                const traveled = data.travelMonths.includes(index + 1)
                return (
                  <motion.div
                    key={month}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-14 h-14 rounded-lg flex items-center justify-center text-sm font-medium ${
                      traveled ? 'bg-white text-[#2EC4B6]' : 'bg-white/20'
                    }`}
                  >
                    {month}
                  </motion.div>
                )
              }
            )}
          </motion.div>
        </div>
      ),
    },

    // Slide 8: Thank You
    {
      bg: 'from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]',
      content: (
        <div className="text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Award className="size-20 mx-auto mb-6" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Here's to {year + 1}!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl opacity-90 mb-6"
          >
            More adventures await
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 justify-center"
          >
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-white text-[#FF6B6B] hover:bg-gray-100"
            >
              <Share2 className="size-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="border-white text-white hover:bg-white/20"
            >
              Close
            </Button>
          </motion.div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Close Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
      >
        <X className="size-5" />
      </button>

      {/* Slide Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-br ${slides[currentSlide].bg} min-h-[500px] flex items-center justify-center p-8`}
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-4 bg-gray-50 flex items-center justify-between">
        <Button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          variant="outline"
          size="sm"
          className="disabled:opacity-50"
        >
          Previous
        </Button>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-[#FF6B6B] w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          variant="outline"
          size="sm"
          className="disabled:opacity-50"
        >
          {currentSlide === slides.length - 1 ? 'Done' : 'Next'}
        </Button>
      </div>
    </Card>
  )
}
