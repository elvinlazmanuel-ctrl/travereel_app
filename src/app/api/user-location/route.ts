import { NextResponse } from 'next/server'
import { getVisaFreeCountries, getCountryByCode } from '@/lib/countries-database'

// GET /api/user-location - Detect user location from IP
export async function GET(request: Request) {
  try {
    // Get user's IP from headers (Vercel sets x-forwarded-for)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Travereel/1.0',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to detect location' },
        { status: 500 }
      )
    }

    const data = await res.json()

    const country = data.country_name || 'Unknown'
    const countryCode = data.country_code || ''
    
    // Get visa-free countries for the detected country
    const visaFreeCountries = countryCode ? getVisaFreeCountries(countryCode) : []
    
    // Get full country data
    const countryData = countryCode ? getCountryByCode(countryCode) : null

    return NextResponse.json({
      country,
      countryCode,
      city: data.city || 'Unknown',
      region: data.region || '',
      latitude: data.latitude,
      longitude: data.longitude,
      currency: countryData?.currency || 'USD',
      continent: countryData?.continent || '',
      visaFreeCountries,
      visaFreeCount: visaFreeCountries.length,
    })
  } catch (error) {
    console.error('Location detection error:', error)
    return NextResponse.json(
      { error: 'Location detection failed' },
      { status: 500 }
    )
  }
}
