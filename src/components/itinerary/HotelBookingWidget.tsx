'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, ExternalLink, Star, MapPin, DollarSign, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useFeatureToggle } from '@/hooks/useFeatureToggle'
import { Skeleton } from '@/components/ui/skeleton'

interface HotelRecommendation {
  id: string
  name: string
  area: string
  rating: number
  pricePerNight: number
  currency: string
  distance: string
  amenities: string[]
  imageUrl: string
  affiliateUrl: string
  isSponsored?: boolean
}

interface HotelBookingWidgetProps {
  location: string
  country: string
  currency: string
  checkIn?: string
  checkOut?: string
}

// Mock hotel data - In production, this would come from Booking.com API
const getMockHotels = (location: string, country: string, currency: string): HotelRecommendation[] => [
  {
    id: 'hotel-1',
    name: 'Luxury Beachfront Resort',
    area: `${location} Beach`,
    rating: 4.8,
    pricePerNight: 120,
    currency: currency,
    distance: '0.2 km from center',
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Beach Access'],
    imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop`,
    affiliateUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location + ' ' + country)}`,
    isSponsored: true,
  },
  {
    id: 'hotel-2',
    name: 'Boutique City Hotel',
    area: `${location} City Center`,
    rating: 4.5,
    pricePerNight: 85,
    currency: currency,
    distance: '0.5 km from center',
    amenities: ['Free WiFi', 'Breakfast', 'Parking'],
    imageUrl: `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop`,
    affiliateUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location + ' ' + country)}`,
  },
  {
    id: 'hotel-3',
    name: 'Budget-Friendly Hostel',
    area: `${location} Old Town`,
    rating: 4.2,
    pricePerNight: 35,
    currency: currency,
    distance: '0.8 km from center',
    amenities: ['Free WiFi', 'Kitchen', 'Lockers'],
    imageUrl: `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop`,
    affiliateUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location + ' ' + country)}`,
  },
]

export function HotelBookingWidget({ location, country, currency, checkIn, checkOut }: HotelBookingWidgetProps) {
  const { enabled, loading } = useFeatureToggle('where_to_stay')
  const [hotels] = useState<HotelRecommendation[]>(getMockHotels(location, country, currency))
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set())

  // Feature is disabled - don't render anything
  if (!enabled && !loading) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  const toggleSave = (hotelId: string) => {
    setSavedHotels((prev) => {
      const next = new Set(prev)
      if (next.has(hotelId)) {
        next.delete(hotelId)
      } else {
        next.add(hotelId)
      }
      return next
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#003580]/10 flex items-center justify-center">
            <Hotel className="size-4 text-[#003580]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Where to Stay</h3>
            <p className="text-[10px] text-gray-500">Recommended areas in {location}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-[#003580]/10 text-[#003580]">
          Powered by Booking.com
        </Badge>
      </div>

      {/* Hotels List */}
      <div className="space-y-3">
        {hotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Hotel Image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {hotel.isSponsored && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                      Sponsored
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleSave(hotel.id)}
                    className="absolute top-2 right-2 size-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`size-4 ${
                        savedHotels.has(hotel.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-white font-medium">{hotel.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="p-3 space-y-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{hotel.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">{hotel.area}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{hotel.distance}</p>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="text-[9px] bg-gray-100 text-gray-600"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-[9px] bg-gray-100 text-gray-600">
                        +{hotel.amenities.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="size-3 text-gray-400" />
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(hotel.pricePerNight)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">per night</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-[#003580] hover:bg-[#004494] text-white text-xs"
                      onClick={() => window.open(hotel.affiliateUrl, '_blank')}
                    >
                      View Deal
                      <ExternalLink className="size-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search All Hotels CTA */}
      <Button
        variant="outline"
        className="w-full h-10 border-[#003580] text-[#003580] hover:bg-[#003580]/10 font-semibold"
        onClick={() =>
          window.open(
            `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location + ' ' + country)}${
              checkIn ? `&checkin=${checkIn}` : ''
            }${checkOut ? `&checkout=${checkOut}` : ''}`,
            '_blank'
          )
        }
      >
        <Hotel className="size-4 mr-2" />
        Search All Hotels in {location}
        <ExternalLink className="size-3 ml-2" />
      </Button>

      {/* Disclaimer */}
      <p className="text-[9px] text-gray-400 text-center">
        Prices may vary. Booking through our links supports Travereel at no extra cost to you.
      </p>
    </div>
  )
}
