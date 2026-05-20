'use client'

import { useState, useEffect } from 'react'
import { Search, Check, MapPin, Loader2, Globe, Shield } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { detectUserLocation, getStoredLocation, storeDetectedLocation, getVisaFreeCountries } from '@/lib/user-location'
import { getAllCountries, getCountryByCode } from '@/lib/countries-database'

// Get all countries from the comprehensive database
const allCountriesData = getAllCountries()

// Extract popular countries (top 16 most visited)
const popularCountries = allCountriesData.filter(c => 
  ['JP', 'TH', 'IT', 'FR', 'US', 'AU', 'GB', 'ES', 'GR', 'MX', 'BR', 'KR', 'VN', 'PH', 'NZ', 'ID'].includes(c.code)
)

export default function StepCountry() {
  const { wizardData, setWizardData } = useAppStore()
  const [search, setSearch] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const [userCountryCode, setUserCountryCode] = useState<string>('')
  const [visaFreeCountries, setVisaFreeCountries] = useState<Set<string>>(new Set())

  // Get user's country code from profile or detected location
  useEffect(() => {
    const stored = getStoredLocation()
    if (stored && stored.countryCode) {
      setUserCountryCode(stored.countryCode)
      setVisaFreeCountries(new Set(getVisaFreeCountries(stored.countryCode)))
    }
  }, [])

  // Auto-detect user location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // Check if we already have a stored location
      const stored = getStoredLocation()
      if (stored) {
        setDetectedCountry(stored.country)
        if (stored.countryCode) {
          setUserCountryCode(stored.countryCode)
          setVisaFreeCountries(new Set(getVisaFreeCountries(stored.countryCode)))
        }
        return
      }

      // Detect location from IP
      setIsDetectingLocation(true)
      try {
        const location = await detectUserLocation()
        if (location && location.country !== 'Unknown') {
          setDetectedCountry(location.country)
          storeDetectedLocation(location)
          
          // Set visa-free countries based on detected location
          if (location.countryCode) {
            setUserCountryCode(location.countryCode)
            setVisaFreeCountries(new Set(getVisaFreeCountries(location.countryCode)))
          }
          
          // Auto-select detected country if user hasn't made a selection yet
          if (!wizardData.country) {
            // Check if detected country is in our list
            const countryExists = allCountriesData.some(c => c.name === location.country)
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

  const filteredAll = allCountriesData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (countryName: string) => {
    setWizardData({ country: countryName })
  }

  const isVisaFree = (countryCode: string) => {
    return visaFreeCountries.has(countryCode)
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
            {popularCountries.map((country) => {
              const visaFree = userCountryCode && isVisaFree(country.code)
              return (
                <button
                  key={country.code}
                  onClick={() => handleSelect(country.name)}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
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
                  {visaFree && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5" title="Visa-free entry">
                      <Shield className="size-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* All Countries List */}
      <div>
        {!search && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            All Countries ({allCountriesData.length})
          </p>
        )}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredAll.map((country) => {
            const visaFree = userCountryCode && isVisaFree(country.code)
            return (
              <button
                key={country.code}
                onClick={() => handleSelect(country.name)}
                className={`relative w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
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
                {visaFree && (
                  <div className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Visa-free
                  </div>
                )}
              </button>
            )
          })}
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
