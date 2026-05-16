import { NextResponse } from 'next/server'

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

    return NextResponse.json({
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      latitude: data.latitude,
      longitude: data.longitude,
    })
  } catch (error) {
    console.error('Location detection error:', error)
    return NextResponse.json(
      { error: 'Location detection failed' },
      { status: 500 }
    )
  }
}
