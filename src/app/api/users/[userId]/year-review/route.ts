import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Fetch all itineraries for this user
    const itineraries = await db.itinerary.findMany({
      where: { authorId: userId },
    })

    // Filter itineraries for the specific year
    const yearItineraries = itineraries.filter((itinerary: any) => {
      const depDate = (itinerary as any).departureDate || itinerary.createdAt
      return new Date(depDate).getFullYear() === year
    })

    // Calculate yearly statistics
    const countries = new Set<string>()
    const cities = new Set<string>()
    let totalDays = 0
    let totalSpent = 0
    let longestTrip: any = { destination: '', days: 0 }
    let shortestTrip: any = { destination: '', days: Infinity }
    const countryCount: Record<string, number> = {}
    const cityCount: Record<string, number> = {}
    const tripsByMonth: Record<number, number> = {}

    yearItineraries.forEach((itinerary: any) => {
      countries.add(itinerary.country)
      cities.add(itinerary.location)
      totalDays += itinerary.days || 0
      totalSpent += itinerary.budget || 0

      // Track longest/shortest
      if (itinerary.days > longestTrip.days) {
        longestTrip = { destination: itinerary.location, days: itinerary.days }
      }
      if (itinerary.days > 0 && itinerary.days < shortestTrip.days) {
        shortestTrip = { destination: itinerary.location, days: itinerary.days }
      }

      // Count frequency for favorites
      countryCount[itinerary.country] = (countryCount[itinerary.country] || 0) + 1
      cityCount[itinerary.location] = (cityCount[itinerary.location] || 0) + 1

      // Track trips by month
      const depDate = (itinerary as any).departureDate || itinerary.createdAt
      const month = new Date(depDate).getMonth() + 1
      tripsByMonth[month] = (tripsByMonth[month] || 0) + 1
    })

    if (shortestTrip.days === Infinity) {
      shortestTrip = { destination: '', days: 0 }
    }

    // Calculate top country and city
    const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'

    // Get months with trips
    const travelMonths = Object.keys(tripsByMonth).map(Number)

    // Get first and last trip dates
    const sortedTrips = yearItineraries
      .map((i: any) => (i as any).departureDate || i.createdAt)
      .sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime())

    const firstTrip = sortedTrips[0] || null
    const lastTrip = sortedTrips[sortedTrips.length - 1] || null

    const yearData = {
      year,
      totalTrips: yearItineraries.length,
      totalCountries: countries.size,
      totalCities: cities.size,
      totalDays,
      totalSpent,
      topCountry,
      topCity,
      longestTrip,
      shortestTrip,
      travelMonths,
      firstTrip,
      lastTrip,
      tripsByMonth,
    }

    return NextResponse.json(yearData)
  } catch (error) {
    console.error('Error fetching year in review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch year in review' },
      { status: 500 }
    )
  }
}
