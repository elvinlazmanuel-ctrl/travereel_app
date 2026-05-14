import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/superadmin/features - Fetch all feature toggles grouped by category
export async function GET() {
  try {
    const features = await db.featureToggle.findMany({
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    })

    // Group by category
    const grouped: Record<string, typeof features> = {}
    for (const feature of features) {
      const cat = feature.category || 'general'
      if (!grouped[cat]) {
        grouped[cat] = []
      }
      grouped[cat].push(feature)
    }

    return NextResponse.json({
      features,
      grouped,
      categories: Object.keys(grouped).sort(),
    })
  } catch (error) {
    console.error('Superadmin features GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/features - Toggle a feature on/off
// Body: { key, enabled }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { key, enabled } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Feature key is required' },
        { status: 400 }
      )
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled must be a boolean value' },
        { status: 400 }
      )
    }

    const existing = await db.featureToggle.findUnique({
      where: { key },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `Feature toggle with key "${key}" not found` },
        { status: 404 }
      )
    }

    const updated = await db.featureToggle.update({
      where: { key },
      data: { enabled },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Superadmin features PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/features - Create a new feature toggle
// Body: { key, label, description?, category?, enabled? }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, label, description, category, enabled } = body

    if (!key || !label) {
      return NextResponse.json(
        { error: 'Key and label are required' },
        { status: 400 }
      )
    }

    // Check if key already exists
    const existing = await db.featureToggle.findUnique({
      where: { key },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Feature toggle with key "${key}" already exists` },
        { status: 409 }
      )
    }

    const feature = await db.featureToggle.create({
      data: {
        key,
        label,
        description: description || null,
        category: category || 'general',
        enabled: enabled !== undefined ? enabled : true,
      },
    })

    return NextResponse.json({ success: true, data: feature }, { status: 201 })
  } catch (error) {
    console.error('Superadmin features POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
