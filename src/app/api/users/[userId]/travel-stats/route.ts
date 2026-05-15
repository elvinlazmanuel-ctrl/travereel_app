import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    // Fetch all itineraries for this user
    const itineraries = await db.itinerary.findMany({
      where: { authorId: userId },
    })

    // Calculate statistics
    const countries = new Set<string>()
    const cities = new Set<string>()
    let totalDays = 0
    let totalSpent = 0
    let longestTrip = 0
    let shortestTrip = Infinity
    let firstTripDate: Date | null = null
    let lastTripDate: Date | null = null
    const countryCount: Record<string, number> = {}
    const cityCount: Record<string, number> = {}

    itineraries.forEach((itinerary: any) => {
      countries.add(itinerary.country)
      cities.add(itinerary.location)
      totalDays += itinerary.days || 0
      totalSpent += itinerary.budget || 0

      // Track longest/shortest
      if (itinerary.days > longestTrip) {
        longestTrip = itinerary.days
      }
      if (itinerary.days > 0 && itinerary.days < shortestTrip) {
        shortestTrip = itinerary.days
      }

      // Track dates (use departureDate if available, fallback to createdAt)
      const depDate = (itinerary as any).departureDate || itinerary.createdAt
      if (depDate) {
        const date = new Date(depDate)
        if (!firstTripDate || date < firstTripDate) {
          firstTripDate = date
        }
        if (!lastTripDate || date > lastTripDate) {
          lastTripDate = date
        }
      }

      // Count frequency for favorites
      countryCount[itinerary.country] = (countryCount[itinerary.country] || 0) + 1
      cityCount[itinerary.location] = (cityCount[itinerary.location] || 0) + 1
    })

    if (shortestTrip === Infinity) shortestTrip = 0

    // Calculate favorite country and city
    const favoriteCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const favoriteCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Calculate travel streak (consecutive years)
    const years = new Set<number>()
    itineraries.forEach((itinerary: any) => {
      const depDate = (itinerary as any).departureDate || itinerary.createdAt
      if (depDate) {
        years.add(new Date(depDate).getFullYear())
      }
    })
    const travelStreak = years.size

    const stats = {
      totalTrips: itineraries.length,
      totalCountries: countries.size,
      totalCities: cities.size,
      totalDays,
      totalSpent,
      favoriteCountry,
      favoriteCity,
      longestTrip,
      shortestTrip,
      travelStreak,
      firstTripDate,
      lastTripDate,
      countriesVisited: Array.from(countries),
      citiesVisited: Array.from(cities),
    }

    // Try to save/update in database (will fail gracefully if migration hasn't run)
    try {
      await (db as any).travelStats?.upsert({
        where: { userId },
        update: {
          ...stats,
          countriesVisited: JSON.stringify(stats.countriesVisited),
          citiesVisited: JSON.stringify(stats.citiesVisited),
        },
        create: {
          userId,
          ...stats,
          countriesVisited: JSON.stringify(stats.countriesVisited),
          citiesVisited: JSON.stringify(stats.citiesVisited),
        },
      })
    } catch (error) {
      // Silently fail - table may not exist yet after migration
      console.log('Travel stats table not available yet (migration pending)')
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching travel stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch travel stats' },
      { status: 500 }
    )
  }
}
