/**
 * Affiliate Booking Links System
 * 
 * Generates affiliate links for:
 * - Hotels/Accommodation (Booking.com, Hotels.com)
 * - Flights (Skyscanner, Kayak)
 * - Activities (Viator, GetYourGuide)
 * - Travel Insurance (WorldNomads)
 * 
 * Monetization: Earn commission on bookings
 */

export interface AffiliateLink {
  provider: string
  type: 'hotel' | 'flight' | 'activity' | 'insurance' | 'transport'
  title: string
  url: string
  estimatedCommission: number // Percentage
  icon?: string
}

export interface AffiliateConfig {
  hotel: {
    bookingCom: {
      partnerId: string
      enabled: boolean
      commission: number
    }
    hotelsCom: {
      affiliateId: string
      enabled: boolean
      commission: number
    }
  }
  flight: {
    skyscanner: {
      affiliateId: string
      enabled: boolean
      commission: number
    }
  }
  activity: {
    viator: {
      affiliateId: string
      enabled: boolean
      commission: number
    }
    getYourGuide: {
      partnerId: string
      enabled: boolean
      commission: number
    }
  }
  insurance: {
    worldNomads: {
      affiliateId: string
      enabled: boolean
      commission: number
    }
  }
}

// Default affiliate configuration
// In production, these should be environment variables
const DEFAULT_CONFIG: AffiliateConfig = {
  hotel: {
    bookingCom: {
      partnerId: process.env.BOOKING_COM_PARTNER_ID || '',
      enabled: true,
      commission: 0.25, // 25% of Booking.com's 25-40% commission
    },
    hotelsCom: {
      affiliateId: process.env.HOTELS_COM_AFFILIATE_ID || '',
      enabled: true,
      commission: 0.50, // 50% of 4-8% commission
    },
  },
  flight: {
    skyscanner: {
      affiliateId: process.env.SKYSCANNER_AFFILIATE_ID || '',
      enabled: true,
      commission: 0.60, // 60% of revenue share
    },
  },
  activity: {
    viator: {
      affiliateId: process.env.VIATOR_AFFILIATE_ID || '',
      enabled: true,
      commission: 0.50, // 50% of 8% commission
    },
    getYourGuide: {
      partnerId: process.env.GETYOURGUIDE_PARTNER_ID || '',
      enabled: true,
      commission: 0.50, // 50% of 8% commission
    },
  },
  insurance: {
    worldNomads: {
      affiliateId: process.env.WORLDNOMADS_AFFILIATE_ID || '',
      enabled: true,
      commission: 0.40, // 40% of commission
    },
  },
}

/**
 * Generate hotel booking link
 */
export function generateHotelLink(
  destination: string,
  checkIn?: string,
  checkOut?: string,
  guests: number = 2
): AffiliateLink[] {
  const links: AffiliateLink[] = []
  
  // Booking.com
  if (DEFAULT_CONFIG.hotel.bookingCom.enabled) {
    const encodedDest = encodeURIComponent(destination)
    const url = `https://www.booking.com/searchresults.html?ss=${encodedDest}&checkin=${checkIn || ''}&checkout=${checkOut || ''}&group_adults=${guests}&aid=${DEFAULT_CONFIG.hotel.bookingCom.partnerId}`
    
    links.push({
      provider: 'Booking.com',
      type: 'hotel',
      title: `Book Hotels in ${destination}`,
      url,
      estimatedCommission: DEFAULT_CONFIG.hotel.bookingCom.commission,
      icon: '🏨',
    })
  }
  
  // Hotels.com
  if (DEFAULT_CONFIG.hotel.hotelsCom.enabled) {
    const encodedDest = encodeURIComponent(destination)
    const url = `https://www.hotels.com/search.do?destination=${encodedDest}&checkIn=${checkIn || ''}&checkOut=${checkOut || ''}&rooms=1&adults=${guests}&affid=${DEFAULT_CONFIG.hotel.hotelsCom.affiliateId}`
    
    links.push({
      provider: 'Hotels.com',
      type: 'hotel',
      title: `Compare Hotel Prices in ${destination}`,
      url,
      estimatedCommission: DEFAULT_CONFIG.hotel.hotelsCom.commission,
      icon: '🏨',
    })
  }
  
  return links
}

/**
 * Generate flight booking link
 */
export function generateFlightLink(
  from: string,
  to: string,
  departureDate?: string,
  returnDate?: string
): AffiliateLink {
  const encodedFrom = encodeURIComponent(from)
  const encodedTo = encodeURIComponent(to)
  
  // Skyscanner
  const url = `https://www.skyscanner.com/transport/flights/${encodedFrom}/${encodedTo}/${departureDate || ''}/?adultsv2=1&cabinclass=economy&affiliateId=${DEFAULT_CONFIG.flight.skyscanner.affiliateId}`
  
  return {
    provider: 'Skyscanner',
    type: 'flight',
    title: `Find Cheap Flights to ${to}`,
    url,
    estimatedCommission: DEFAULT_CONFIG.flight.skyscanner.commission,
    icon: '✈️',
  }
}

/**
 * Generate activity booking links
 */
export function generateActivityLinks(
  destination: string,
  activities?: string[]
): AffiliateLink[] {
  const links: AffiliateLink[] = []
  const encodedDest = encodeURIComponent(destination)
  
  // Viator
  if (DEFAULT_CONFIG.activity.viator.enabled) {
    const url = `https://www.viator.com/${encodedDest}/d0-tda?aid=${DEFAULT_CONFIG.activity.viator.affiliateId}`
    
    links.push({
      provider: 'Viator',
      type: 'activity',
      title: `Book Tours & Activities in ${destination}`,
      url,
      estimatedCommission: DEFAULT_CONFIG.activity.viator.commission,
      icon: '🎯',
    })
  }
  
  // GetYourGuide
  if (DEFAULT_CONFIG.activity.getYourGuide.enabled) {
    const url = `https://www.getyourguide.com/${encodedDest}/?partner_id=${DEFAULT_CONFIG.activity.getYourGuide.partnerId}`
    
    links.push({
      provider: 'GetYourGuide',
      type: 'activity',
      title: `Discover Experiences in ${destination}`,
      url,
      estimatedCommission: DEFAULT_CONFIG.activity.getYourGuide.commission,
      icon: '🎫',
    })
  }
  
  return links
}

/**
 * Generate travel insurance link
 */
export function generateInsuranceLink(
  destination: string,
  duration: number
): AffiliateLink {
  const encodedDest = encodeURIComponent(destination)
  
  const url = `https://www.worldnomads.com/?affiliateId=${DEFAULT_CONFIG.insurance.worldNomads.affiliateId}&destination=${encodedDest}&duration=${duration}`
  
  return {
    provider: 'WorldNomads',
    type: 'insurance',
    title: `Get Travel Insurance for ${destination}`,
    url,
    estimatedCommission: DEFAULT_CONFIG.insurance.worldNomads.commission,
    icon: '🛡️',
  }
}

/**
 * Generate all affiliate links for an itinerary
 */
export function generateItineraryAffiliateLinks(
  itinerary: {
    country: string
    location: string
    departureDate?: string
    returnDate?: string
    days: number
    activities?: string[]
    hasHotel?: boolean
  }
): AffiliateLink[] {
  const links: AffiliateLink[] = []
  
  // Hotel links
  if (itinerary.hasHotel !== false) {
    const hotelLinks = generateHotelLink(
      itinerary.location,
      itinerary.departureDate,
      itinerary.returnDate
    )
    links.push(...hotelLinks)
  }
  
  // Flight links (if departure/return dates provided)
  if (itinerary.departureDate) {
    const flightLink = generateFlightLink(
      'Your City', // Could be user's location
      itinerary.location,
      itinerary.departureDate,
      itinerary.returnDate
    )
    links.push(flightLink)
  }
  
  // Activity links
  const activityLinks = generateActivityLinks(
    itinerary.location,
    itinerary.activities
  )
  links.push(...activityLinks)
  
  // Insurance link
  const insuranceLink = generateInsuranceLink(
    itinerary.location,
    itinerary.days
  )
  links.push(insuranceLink)
  
  return links
}

/**
 * Calculate estimated revenue from affiliate clicks
 */
export function estimateAffiliateRevenue(
  clicks: number,
  conversionRate: number = 0.03, // 3% average conversion
  averageBookingValue: number = 200, // USD
  commission: number = 0.08 // 8% average commission
): {
  totalClicks: number
  estimatedBookings: number
  estimatedRevenue: number
  perClickValue: number
} {
  const estimatedBookings = Math.ceil(clicks * conversionRate)
  const estimatedRevenue = estimatedBookings * averageBookingValue * commission
  const perClickValue = clicks > 0 ? estimatedRevenue / clicks : 0
  
  return {
    totalClicks: clicks,
    estimatedBookings,
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    perClickValue: Math.round(perClickValue * 100) / 100,
  }
}

/**
 * Track affiliate link click (for analytics)
 * In production, this would call your analytics API
 */
export function trackAffiliateClick(
  linkType: string,
  provider: string,
  itineraryId: string,
  userId?: string
): void {
  // In production, send to your analytics/tracking system
  console.log(`[Affiliate Click] ${provider} ${linkType} for itinerary ${itineraryId}${userId ? ` by user ${userId}` : ''}`)
  
  // Example: Send to analytics API
  // fetch('/api/analytics/affiliate-click', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     linkType,
  //     provider,
  //     itineraryId,
  //     userId,
  //     timestamp: new Date().toISOString(),
  //   }),
  // })
}
