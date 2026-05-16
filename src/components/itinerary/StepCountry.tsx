'use client'

import { useState, useEffect } from 'react'
import { Search, Check, MapPin, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { detectUserLocation, getStoredLocation, storeDetectedLocation } from '@/lib/user-location'

const popularCountries = [
  { flag: '🇯🇵', name: 'Japan', code: 'JP' },
  { flag: '🇹🇭', name: 'Thailand', code: 'TH' },
  { flag: '🇮🇹', name: 'Italy', code: 'IT' },
  { flag: '🇫🇷', name: 'France', code: 'FR' },
  { flag: '🇺🇸', name: 'USA', code: 'US' },
  { flag: '🇦🇺', name: 'Australia', code: 'AU' },
  { flag: '🇬🇧', name: 'UK', code: 'GB' },
  { flag: '🇪🇸', name: 'Spain', code: 'ES' },
  { flag: '🇬🇷', name: 'Greece', code: 'GR' },
  { flag: '🇲🇽', name: 'Mexico', code: 'MX' },
  { flag: '🇧🇷', name: 'Brazil', code: 'BR' },
  { flag: '🇰🇷', name: 'South Korea', code: 'KR' },
  { flag: '🇻🇳', name: 'Vietnam', code: 'VN' },
  { flag: '🇵🇭', name: 'Philippines', code: 'PH' },
  { flag: '🇳🇿', name: 'New Zealand', code: 'NZ' },
  { flag: '🇮🇩', name: 'Indonesia', code: 'ID' },
]

const allCountries = [
  ...popularCountries,
  { flag: '🇩🇪', name: 'Germany', code: 'DE' },
  { flag: '🇵🇹', name: 'Portugal', code: 'PT' },
  { flag: '🇳🇱', name: 'Netherlands', code: 'NL' },
  { flag: '🇨🇭', name: 'Switzerland', code: 'CH' },
  { flag: '🇦🇹', name: 'Austria', code: 'AT' },
  { flag: '🇨🇿', name: 'Czech Republic', code: 'CZ' },
  { flag: '🇭🇷', name: 'Croatia', code: 'HR' },
  { flag: '🇹🇷', name: 'Turkey', code: 'TR' },
  { flag: '🇲🇦', name: 'Morocco', code: 'MA' },
  { flag: '🇪🇬', name: 'Egypt', code: 'EG' },
  { flag: '🇿🇦', name: 'South Africa', code: 'ZA' },
  { flag: '🇰🇪', name: 'Kenya', code: 'KE' },
  { flag: '🇹🇿', name: 'Tanzania', code: 'TZ' },
  { flag: '🇮🇳', name: 'India', code: 'IN' },
  { flag: '🇱🇰', name: 'Sri Lanka', code: 'LK' },
  { flag: '🇳🇵', name: 'Nepal', code: 'NP' },
  { flag: '🇲🇾', name: 'Malaysia', code: 'MY' },
  { flag: '🇸🇬', name: 'Singapore', code: 'SG' },
  { flag: '🇨🇳', name: 'China', code: 'CN' },
  { flag: '🇨🇦', name: 'Canada', code: 'CA' },
  { flag: '🇦🇷', name: 'Argentina', code: 'AR' },
  { flag: '🇨🇴', name: 'Colombia', code: 'CO' },
  { flag: '🇵🇪', name: 'Peru', code: 'PE' },
  { flag: '🇨🇱', name: 'Chile', code: 'CL' },
  { flag: '🇮🇸', name: 'Iceland', code: 'IS' },
  { flag: '🇳🇴', name: 'Norway', code: 'NO' },
  { flag: '🇸🇪', name: 'Sweden', code: 'SE' },
  { flag: '🇩🇰', name: 'Denmark', code: 'DK' },
  { flag: '🇫🇮', name: 'Finland', code: 'FI' },
  { flag: '🇵🇱', name: 'Poland', code: 'PL' },
  { flag: '🇭🇺', name: 'Hungary', code: 'HU' },
  { flag: '🇷🇴', name: 'Romania', code: 'RO' },
  { flag: '🇮🇱', name: 'Israel', code: 'IL' },
  { flag: '🇯🇴', name: 'Jordan', code: 'JO' },
  { flag: '🇦🇪', name: 'UAE', code: 'AE' },
  { flag: '🇶🇦', name: 'Qatar', code: 'QA' },
  { flag: '🇸🇦', name: 'Saudi Arabia', code: 'SA' },
  { flag: '🇨🇷', name: 'Costa Rica', code: 'CR' },
  { flag: '🇨🇺', name: 'Cuba', code: 'CU' },
  { flag: '🇯🇲', name: 'Jamaica', code: 'JM' },
  { flag: '🇩🇴', name: 'Dominican Republic', code: 'DO' },
  { flag: '🇫🇯', name: 'Fiji', code: 'FJ' },
  { flag: '🇲🇻', name: 'Maldives', code: 'MV' },
]

export default function StepCountry() {
  const { wizardData, setWizardData } = useAppStore()
  const [search, setSearch] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)

  // Auto-detect user location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // Check if we already have a stored location
      const stored = getStoredLocation()
      if (stored) {
        setDetectedCountry(stored.country)
        return
      }

      // Detect location from IP
      setIsDetectingLocation(true)
      try {
        const location = await detectUserLocation()
        if (location && location.country !== 'Unknown') {
          setDetectedCountry(location.country)
          storeDetectedLocation(location)
          
          // Auto-select detected country if user hasn't made a selection yet
          if (!wizardData.country) {
            // Check if detected country is in our list
            const countryExists = allCountries.some(c => c.name === location.country)
            if (countryExists) {
              handleSelect(location.country)
            }
          }
        }
      } catch (error) {
        console.warn('Location detection failed:', error)
      } finally {
        setIsDetectingLocation(false)
      }
    }

    detectLocation()
  }, [])

  const filteredAll = allCountries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (countryName: string) => {
    setWizardData({ country: countryName })
  }

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Itinerary Name
        </label>
        <Input
          placeholder="My Amazing Trip"
          value={wizardData.title}
          onChange={(e) => setWizardData({ title: e.target.value })}
          className="w-full"
        />
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Which country do you want to visit?
        </h2>
        <p className="text-sm text-muted-foreground">Select a country for your adventure</p>
        {isDetectingLocation && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[#2EC4B6]">
            <Loader2 className="size-3 animate-spin" />
            <span>Detecting your location...</span>
          </div>
        )}
        {detectedCountry && !isDetectingLocation && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span>Detected: {detectedCountry}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Popular Countries Grid */}
      {!search && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Popular Destinations
          </p>
          <div className="grid grid-cols-2 gap-2">
            {popularCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country.name)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  wizardData.country === country.name
                    ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="text-sm font-medium text-foreground flex-1 text-left">
                  {country.name}
                </span>
                {wizardData.country === country.name && (
                  <Check className="size-4 text-[#FF6B6B] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Countries List */}
      <div>
        {!search && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            All Countries
          </p>
        )}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredAll.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                wizardData.country === country.name
                  ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 shadow-sm'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm font-medium text-foreground flex-1 text-left">
                {country.name}
              </span>
              {wizardData.country === country.name && (
                <Check className="size-4 text-[#FF6B6B] shrink-0" />
              )}
            </button>
          ))}
          {filteredAll.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <MapPin className="size-8 text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">No countries found</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
