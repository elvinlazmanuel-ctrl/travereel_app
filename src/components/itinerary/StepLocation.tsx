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

  const handleSelect = (locationName: string) => {
    setWizardData({ location: locationName })
  }

  const handleAddCustom = () => {
    if (customLocation.trim()) {
      setWizardData({ location: customLocation.trim() })
      setCustomLocation('')
      setShowCustom(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Where in {wizardData.country || 'the world'}?
        </h2>
        <p className="text-sm text-gray-500">
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
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Popular in {wizardData.country || 'this region'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {filteredLocations.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleSelect(loc.name)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                wizardData.location === loc.name
                  ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{loc.emoji}</span>
              <span className="text-sm font-medium text-gray-800 flex-1 text-left">
                {loc.name}
              </span>
              {wizardData.location === loc.name && (
                <Check className="size-4 text-[#FF6B6B] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Location */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-2 text-sm font-medium text-[#2EC4B6] hover:text-[#2EC4B6]/80 transition-colors"
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
            className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white shrink-0"
          >
            Add
          </Button>
        </div>
      )}

      {/* Selected Location Display */}
      {wizardData.location && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#FF6B6B]/5 to-[#FF8C42]/5 border border-[#FF6B6B]/20">
            <MapPin className="size-5 text-[#FF6B6B]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{wizardData.location}</p>
              <p className="text-xs text-gray-500">{wizardData.country}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
