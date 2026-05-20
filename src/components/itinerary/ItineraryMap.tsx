'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.TileLayer })),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Marker })),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Popup })),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Polyline })),
  { ssr: false }
)

// City coordinates database (fallback)
const cityCoordinates: Record<string, [number, number]> = {
  'paris,france': [48.8566, 2.3522],
  'tokyo,japan': [35.6762, 139.6503],
  'bangkok,thailand': [13.7563, 100.5018],
  'manila,philippines': [14.5995, 120.9842],
  'seoul,south korea': [37.5665, 126.9780],
  'sydney,australia': [-33.8688, 151.2093],
  'london,uk': [51.5074, -0.1278],
  'new york,usa': [40.7128, -74.0060],
  'dubai,uae': [25.2048, 55.2708],
  'singapore,singapore': [1.3521, 103.8198],
  'rome,italy': [41.9028, 12.4964],
  'barcelona,spain': [41.3851, 2.1734],
  'amsterdam,netherlands': [52.3676, 4.9041],
  'bali,indonesia': [-8.3405, 115.0920],
  'cebu,philippines': [10.3157, 123.8854],
  'boracay,philippines': [11.9674, 121.9248],
  'palawan,philippines': [9.8345, 118.7384],
}

interface ItineraryMapProps {
  location: string
  country: string
  days_plan?: Array<{
    dayNumber: number
    activities: Array<{
      title: string
      location: string
    }>
  }>
}

export function ItineraryMap({ location, country, days_plan }: ItineraryMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true)
      
      // Try to find in our database first
      const key = `${location.toLowerCase()},${country.toLowerCase()}`
      if (cityCoordinates[key]) {
        setCoordinates(cityCoordinates[key])
        setLoading(false)
        return
      }

      // Fallback: Try to geocode using free API
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${location}, ${country}`)}&limit=1`
        )
        const data = await response.json()
        
        if (data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          // Ultimate fallback: center of country
          setCoordinates([20, 0]) // Rough center of world
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setCoordinates([20, 0])
      } finally {
        setLoading(false)
      }
    }

    fetchCoordinates()
  }, [location, country])

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-[#2F5C9B] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!coordinates) {
    return null
  }

  // Collect all unique activity locations
  const allLocations = new Set<string>()
  allLocations.add(`${location}, ${country}`)
  
  if (days_plan) {
    days_plan.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.location) {
          allLocations.add(activity.location)
        }
      })
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-80 relative">
        {/* @ts-ignore - Leaflet types are tricky */}
        <MapContainer
          center={coordinates}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* @ts-ignore */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Main location marker */}
          {/* @ts-ignore */}
          <Marker position={coordinates}>
            {/* @ts-ignore */}
            <Popup>
              <div className="text-center">
                <MapPin className="size-4 mx-auto mb-1 text-[#2F5C9B]" />
                <p className="font-semibold">{location}</p>
                <p className="text-xs text-gray-500">{country}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Location Info */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[#2F5C9B]" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {location}, {country}
            </p>
            <p className="text-xs text-gray-500">
              {allLocations.size} location{allLocations.size > 1 ? 's' : ''} in itinerary
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
