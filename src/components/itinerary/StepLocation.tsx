'use client'

import { useState } from 'react'
import { Search, Check, MapPin, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const locationMap: Record<string, { name: string; emoji: string }[]> = {
  Japan: [
    { name: 'Tokyo', emoji: '🗼' },
    { name: 'Osaka', emoji: '🏯' },
    { name: 'Kyoto', emoji: '⛩️' },
    { name: 'Hiroshima', emoji: '🌊' },
    { name: 'Nara', emoji: '🦌' },
    { name: 'Okinawa', emoji: '🏖️' },
  ],
  Thailand: [
    { name: 'Bangkok', emoji: '🛕' },
    { name: 'Chiang Mai', emoji: '🏔️' },
    { name: 'Phuket', emoji: '🏖️' },
    { name: 'Pattaya', emoji: '🌴' },
    { name: 'Krabi', emoji: '🧗' },
  ],
  Italy: [
    { name: 'Rome', emoji: '🏛️' },
    { name: 'Florence', emoji: '🎨' },
    { name: 'Venice', emoji: '🛶' },
    { name: 'Milan', emoji: '👗' },
    { name: 'Naples', emoji: '🍕' },
    { name: 'Amalfi Coast', emoji: '🌊' },
  ],
  Philippines: [
    { name: 'Manila', emoji: '🏙️' },
    { name: 'Cebu', emoji: '🏖️' },
    { name: 'Palawan', emoji: '🏝️' },
    { name: 'Boracay', emoji: '🌅' },
    { name: 'Siargao', emoji: '🏄' },
    { name: 'Bohol', emoji: '👁️' },
  ],
  France: [
    { name: 'Paris', emoji: '🗼' },
    { name: 'Nice', emoji: '🏖️' },
    { name: 'Lyon', emoji: '🍷' },
    { name: 'Marseille', emoji: '⛵' },
    { name: 'Bordeaux', emoji: '🍇' },
  ],
  USA: [
    { name: 'New York', emoji: '🗽' },
    { name: 'Los Angeles', emoji: '🎬' },
    { name: 'San Francisco', emoji: '🌉' },
    { name: 'Miami', emoji: '🌴' },
    { name: 'Las Vegas', emoji: '🎰' },
    { name: 'Hawaii', emoji: '🌺' },
  ],
  Australia: [
    { name: 'Sydney', emoji: '🎭' },
    { name: 'Melbourne', emoji: '☕' },
    { name: 'Brisbane', emoji: '☀️' },
    { name: 'Gold Coast', emoji: '🏖️' },
    { name: 'Perth', emoji: '🌊' },
  ],
  UK: [
    { name: 'London', emoji: '🏰' },
    { name: 'Edinburgh', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    { name: 'Manchester', emoji: '⚽' },
    { name: 'Bath', emoji: '🏛️' },
    { name: 'Oxford', emoji: '🎓' },
  ],
  Spain: [
    { name: 'Barcelona', emoji: '🏛️' },
    { name: 'Madrid', emoji: '💃' },
    { name: 'Seville', emoji: '🌞' },
    { name: 'Valencia', emoji: '🌊' },
    { name: 'Granada', emoji: '🏰' },
  ],
  Greece: [
    { name: 'Athens', emoji: '🏛️' },
    { name: 'Santorini', emoji: '🏘️' },
    { name: 'Mykonos', emoji: '🏖️' },
    { name: 'Crete', emoji: '🌊' },
    { name: 'Thessaloniki', emoji: '🏰' },
  ],
  Mexico: [
    { name: 'Mexico City', emoji: '🏙️' },
    { name: 'Cancun', emoji: '🏖️' },
    { name: 'Playa del Carmen', emoji: '🌴' },
    { name: 'Oaxaca', emoji: '🎨' },
    { name: 'Tulum', emoji: '🏛️' },
  ],
  Brazil: [
    { name: 'Rio de Janeiro', emoji: '🗽' },
    { name: 'São Paulo', emoji: '🏙️' },
    { name: 'Salvador', emoji: '💃' },
    { name: 'Florianópolis', emoji: '🏖️' },
  ],
  'South Korea': [
    { name: 'Seoul', emoji: '🏙️' },
    { name: 'Busan', emoji: '🏖️' },
    { name: 'Jeju Island', emoji: '🏝️' },
    { name: 'Incheon', emoji: '✈️' },
  ],
  Vietnam: [
    { name: 'Hanoi', emoji: '🏯' },
    { name: 'Ho Chi Minh City', emoji: '🏙️' },
    { name: 'Da Nang', emoji: '🏖️' },
    { name: 'Hoi An', emoji: '🏮' },
    { name: 'Ha Long Bay', emoji: '⛵' },
  ],
  'New Zealand': [
    { name: 'Auckland', emoji: '🏙️' },
    { name: 'Queenstown', emoji: '🏔️' },
    { name: 'Wellington', emoji: '🌊' },
    { name: 'Rotorua', emoji: '♨️' },
  ],
  Indonesia: [
    { name: 'Bali', emoji: '🏝️' },
    { name: 'Jakarta', emoji: '🏙️' },
    { name: 'Yogyakarta', emoji: '🏛️' },
    { name: 'Lombok', emoji: '🏖️' },
    { name: 'Komodo', emoji: '🦎' },
  ],
}

const defaultLocations = [
  { name: 'Capital City', emoji: '🏙️' },
  { name: 'Coastal Area', emoji: '🏖️' },
  { name: 'Mountain Region', emoji: '🏔️' },
  { name: 'Cultural District', emoji: '🏛️' },
  { name: 'Countryside', emoji: '🌾' },
]

export default function StepLocation() {
  const { wizardData, setWizardData } = useAppStore()
  const [search, setSearch] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const locations = locationMap[wizardData.country] || defaultLocations

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  )

  // Get selected locations as array
  const selectedLocations: string[] = Array.isArray(wizardData.location) 
    ? wizardData.location 
    : wizardData.location ? [wizardData.location] : []

  const handleToggleLocation = (locationName: string) => {
    const currentLocations = Array.isArray(wizardData.location) 
      ? [...wizardData.location] 
      : wizardData.location ? [wizardData.location] : []
    
    const index = currentLocations.indexOf(locationName)
    if (index > -1) {
      // Remove location
      currentLocations.splice(index, 1)
    } else {
      // Add location
      currentLocations.push(locationName)
    }
    
    setWizardData({ location: currentLocations })
  }

  const handleAddCustom = () => {
    if (customLocation.trim()) {
      const currentLocations = Array.isArray(wizardData.location) 
        ? [...wizardData.location] 
        : wizardData.location ? [wizardData.location] : []
      
      currentLocations.push(customLocation.trim())
      setWizardData({ location: currentLocations })
      setCustomLocation('')
      setShowCustom(false)
    }
  }

  const handleRemoveLocation = (locationName: string) => {
    const currentLocations = Array.isArray(wizardData.location) 
      ? wizardData.location.filter(loc => loc !== locationName)
      : []
    setWizardData({ location: currentLocations })
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Where in {wizardData.country || 'the world'}?
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a destination city or region
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Popular Locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Popular in {wizardData.country || 'this region'}
          </p>
          {selectedLocations.length > 0 && (
            <span className="text-xs text-[#5CA5CD] font-medium">
              {selectedLocations.length} selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocations.includes(loc.name)
            return (
              <button
                key={loc.name}
                onClick={() => handleToggleLocation(loc.name)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#2F5C9B] bg-[#2F5C9B]/5 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{loc.emoji}</span>
                <span className="text-sm font-medium text-foreground flex-1 text-left">
                  {loc.name}
                </span>
                {isSelected && (
                  <Check className="size-4 text-[#2F5C9B] shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Location */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-2 text-sm font-medium text-[#5CA5CD] hover:text-[#5CA5CD]/80 transition-colors"
        >
          <Plus className="size-4" />
          Add custom location
        </button>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Enter location name..."
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom()
              }}
            />
          </div>
          <Button
            onClick={handleAddCustom}
            size="sm"
            className="bg-[#5CA5CD] hover:bg-[#5CA5CD]/90 text-white shrink-0"
          >
            Add
          </Button>
        </div>
      )}

      {/* Selected Locations Display */}
      {selectedLocations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#2F5C9B]/5 to-[#5CA5CD]/5 border border-[#2F5C9B]/20">
            <MapPin className="size-5 text-[#2F5C9B] shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Selected Destinations ({selectedLocations.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedLocations.map((loc) => {
                  const locationData = locations.find(l => l.name === loc)
                  return (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#2F5C9B]/20 text-xs font-medium text-foreground"
                    >
                      {locationData?.emoji || '📍'} {loc}
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="ml-1 text-gray-400 hover:text-[#FF6B6B] transition-colors"
                        aria-label={`Remove ${loc}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
