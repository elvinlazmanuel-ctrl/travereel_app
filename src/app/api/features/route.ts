import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/features - Public endpoint to check feature toggle status
// This endpoint does NOT require authentication and only returns basic feature info
export async function GET() {
  try {
    const features = await db.featureToggle.findMany({
      where: { enabled: true }, // Only return enabled features
      select: {
        key: true,
        enabled: true,
        category: true,
        apiConfig: true, // Public config (no sensitive data)
        metadata: true,  // Public metadata
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    })

    return NextResponse.json({
      features,
    })
  } catch (error) {
    // Log error but return empty features instead of 500
    console.warn('FeatureToggle table not found or database error (this is OK if table not created yet):', error)
    
    // Return default enabled features as fallback
    const defaultFeatures = [
      { key: 'where_to_stay', enabled: true, category: 'travel', apiConfig: null, metadata: null },
      { key: 'travel_insurance', enabled: true, category: 'travel', apiConfig: null, metadata: null },
      { key: 'weather_forecast', enabled: true, category: 'travel', apiConfig: null, metadata: null },
      { key: 'currency_converter', enabled: true, category: 'travel', apiConfig: null, metadata: null },
    ]

    return NextResponse.json({
      features: defaultFeatures,
      fallback: true,
    })
  }
}
