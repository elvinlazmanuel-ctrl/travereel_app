import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/superadmin/settings - Fetch all platform settings as key-value pairs
export async function GET() {
  try {
    const settings = await db.platformSettings.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value map for easy access
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json({
      settings,
      settingsMap,
    })
  } catch (error) {
    console.error('Superadmin settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/settings - Update a setting
// Body: { key, value }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Setting value is required' },
        { status: 400 }
      )
    }

    const existing = await db.platformSettings.findUnique({
      where: { key },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `Setting with key "${key}" not found. Use POST to create a new setting.` },
        { status: 404 }
      )
    }

    const updated = await db.platformSettings.update({
      where: { key },
      data: { value: String(value) },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Superadmin settings PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/settings - Create a new setting
// Body: { key, value }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Setting value is required' },
        { status: 400 }
      )
    }

    // Check if key already exists
    const existing = await db.platformSettings.findUnique({
      where: { key },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Setting with key "${key}" already exists. Use PUT to update.` },
        { status: 409 }
      )
    }

    const setting = await db.platformSettings.create({
      data: {
        key,
        value: String(value),
      },
    })

    return NextResponse.json({ success: true, data: setting }, { status: 201 })
  } catch (error) {
    console.error('Superadmin settings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/settings - Delete a setting
// Body: { key }
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const existing = await db.platformSettings.findUnique({
      where: { key },
    })

    if (!existing) {
      return NextResponse.json(
        { error: `Setting with key "${key}" not found` },
        { status: 404 }
      )
    }

    await db.platformSettings.delete({
      where: { key },
    })

    return NextResponse.json({ success: true, message: `Setting "${key}" deleted` })
  } catch (error) {
    console.error('Superadmin settings DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
