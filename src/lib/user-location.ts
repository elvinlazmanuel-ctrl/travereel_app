/**
 * User Location Detection Utility
 * Uses IP geolocation to detect user's country and set appropriate defaults
 * Includes visa-free detection and comprehensive country data
 */

import { 
  getVisaFreeCountries, 
  isVisaFree, 
  getCountryByCode, 
  getCountryByName,
  countryToCurrency,
  countryToRegion,
  travelRequirementsByRegion 
} from './countries-database'

export { countryToCurrency, countryToRegion, travelRequirementsByRegion }
export { getVisaFreeCountries, isVisaFree, getCountryByCode, getCountryByName }

export interface UserLocation {
  country: string
  countryCode: string
  city: string
  region: string
  currency: string
  travelRequirements: string[]
}

/**
 * Detect user location using IP geolocation
 * Returns location data with currency and travel requirements
 */
export async function detectUserLocation(): Promise<UserLocation | null> {
  try {
    // Try multiple free IP geolocation services for reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
    ]

    let data: any = null

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          data = await response.json()
          break
        }
      } catch (error) {
        console.warn(`Location service ${service} failed:`, error)
        continue
      }
    }

    if (!data) {
      console.warn('All location services failed')
      return null
    }

    // Normalize data from different services
    const country = data.country_name || data.country || 'Unknown'
    const countryCode = data.country_code || data.countryCode || ''
    const city = data.city || 'Unknown'
    
    // Get currency based on detected country
    const currency = countryToCurrency[country] || 'USD'
    
    // Get region and travel requirements
    const region = countryToRegion[country] || 'International'
    const travelRequirements = travelRequirementsByRegion[region] || travelRequirementsByRegion['International'] || []

    return {
      country,
      countryCode,
      city,
      region,
      currency,
      travelRequirements,
    }
  } catch (error) {
    console.error('Location detection failed:', error)
    return null
  }
}

/**
 * Get currency for a specific country
 */
export function getCurrencyForCountry(country: string): string {
  return countryToCurrency[country] || 'USD'
}

/**
 * Get travel requirements for a specific country
 */
export function getTravelRequirementsForCountry(country: string): string[] {
  const region = countryToRegion[country]
  return travelRequirementsByRegion[region] || []
}

/**
 * Get visa status information for a destination based on user's country
 */
export function getVisaStatus(userCountryCode: string, destinationCountryCode: string): {
  isVisaFree: boolean
  message: string
} {
  const visaFree = isVisaFree(userCountryCode, destinationCountryCode)
  
  if (visaFree) {
    return {
      isVisaFree: true,
      message: 'Visa-free entry',
    }
  }
  
  return {
    isVisaFree: false,
    message: 'Visa required',
  }
}

/**
 * Store detected location in localStorage for persistence
 */
export function storeDetectedLocation(location: UserLocation) {
  try {
    localStorage.setItem('detected_location', JSON.stringify(location))
    localStorage.setItem('location_detected_at', new Date().toISOString())
  } catch (error) {
    console.warn('Failed to store location:', error)
  }
}

/**
 * Retrieve stored location from localStorage
 */
export function getStoredLocation(): UserLocation | null {
  try {
    const stored = localStorage.getItem('detected_location')
    if (!stored) return null

    // Check if location was detected more than 30 days ago (stale)
    const detectedAt = localStorage.getItem('location_detected_at')
    if (detectedAt) {
      const daysSinceDetection = (Date.now() - new Date(detectedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDetection > 30) {
        localStorage.removeItem('detected_location')
        localStorage.removeItem('location_detected_at')
        return null
      }
    }

    return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to retrieve stored location:', error)
    return null
  }
}

/**
 * Check if location has already been detected
 */
export function hasDetectedLocation(): boolean {
  return !!localStorage.getItem('detected_location')
}
