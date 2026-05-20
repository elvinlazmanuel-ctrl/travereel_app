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
    console.error('Public features GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
