import { db } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/superadmin-middleware'
import { logAdminAction } from '@/lib/audit-logger'
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/api-key-encryption'

// GET /api/superadmin/features - Fetch all feature toggles grouped by category
export async function GET(request: NextRequest) {
  try {
    // Authenticate superadmin
    const auth = await requireSuperAdmin(request)
    if (!auth.success) {
      return auth.error!
    }

    const features = await db.featureToggle.findMany({
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    })

    // Mask API keys in response for security
    const sanitizedFeatures = features.map(feature => ({
      ...feature,
      apiKey: feature.apiKey ? maskApiKey(feature.apiKey) : null,
      apiConfig: feature.apiConfig || null,
    }))

    // Group by category
    const grouped: Record<string, typeof sanitizedFeatures> = {}
    for (const feature of sanitizedFeatures) {
      const cat = feature.category || 'general'
      if (!grouped[cat]) {
        grouped[cat] = []
      }
      grouped[cat].push(feature)
    }

    return NextResponse.json({
      features: sanitizedFeatures,
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

// PUT /api/superadmin/features - Update a feature toggle (including API keys)
// Body: { key, enabled?, apiKey?, apiConfig?, metadata? }
export async function PUT(request: NextRequest) {
  try {
    // Authenticate superadmin
    const auth = await requireSuperAdmin(request)
    if (!auth.success) {
      return auth.error!
    }

    const body = await request.json()
    const { key, enabled, apiKey, apiConfig, metadata } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Feature key is required' },
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

    // Prepare update data
    const updateData: any = {}
    if (typeof enabled === 'boolean') updateData.enabled = enabled
    
    // Encrypt API key if provided
    if (apiKey !== undefined) {
      if (apiKey === null || apiKey === '') {
        updateData.apiKey = null // Remove API key
      } else {
        updateData.apiKey = await encryptApiKey(apiKey)
      }
    }
    
    if (apiConfig !== undefined) updateData.apiConfig = apiConfig
    if (metadata !== undefined) updateData.metadata = metadata

    const updated = await db.featureToggle.update({
      where: { key },
      data: updateData,
    })

    // Log the action
    await logAdminAction({
      adminId: auth.admin!.id,
      action: 'FEATURE_UPDATE',
      target: key,
      details: JSON.stringify({ enabled, hasApiKey: apiKey !== undefined }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      outcome: 'success',
    })

    // Return sanitized data
    const sanitizedData = {
      ...updated,
      apiKey: updated.apiKey ? maskApiKey(updated.apiKey) : null,
    }

    return NextResponse.json({ success: true, data: sanitizedData })
  } catch (error) {
    console.error('Superadmin features PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/features - Create a new feature toggle
// Body: { key, label, description?, category?, enabled?, apiKey?, apiConfig?, metadata? }
export async function POST(request: NextRequest) {
  try {
    // Authenticate superadmin
    const auth = await requireSuperAdmin(request)
    if (!auth.success) {
      return auth.error!
    }

    const body = await request.json()
    const { key, label, description, category, enabled, apiKey, apiConfig, metadata } = body

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

    // Encrypt API key if provided
    let encryptedApiKey = null
    if (apiKey) {
      encryptedApiKey = await encryptApiKey(apiKey)
    }

    const feature = await db.featureToggle.create({
      data: {
        key,
        label,
        description: description || null,
        category: category || 'general',
        enabled: enabled !== undefined ? enabled : true,
        apiKey: encryptedApiKey,
        apiConfig: apiConfig || null,
        metadata: metadata || null,
      },
    })

    // Log the action
    await logAdminAction({
      adminId: auth.admin!.id,
      action: 'FEATURE_CREATE',
      target: key,
      details: JSON.stringify({ label, category, hasApiKey: !!apiKey }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      outcome: 'success',
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
