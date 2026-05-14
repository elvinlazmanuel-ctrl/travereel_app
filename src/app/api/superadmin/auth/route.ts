import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { loginSchema, validateBody } from '@/lib/validation'

const SUPERADMIN_EMAIL = 'superadmin@travereel.com'
const SUPERADMIN_PASSWORD = 'superadmin2024'

export async function POST(request: Request) {
  try {
    // Rate limit auth operations
    const rateLimitResponse = withRateLimit(request, 'auth')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check against hardcoded superadmin credentials
    if (email === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD) {
      // Find or create a superadmin user in the database
      let adminUser = await db.user.findFirst({
        where: { role: 'admin' },
      })

      // If no admin user exists, create one
      if (!adminUser) {
        adminUser = await db.user.create({
          data: {
            email: SUPERADMIN_EMAIL,
            username: 'superadmin',
            name: 'Super Admin',
            password: SUPERADMIN_PASSWORD,
            role: 'admin',
            isPrivate: false,
          },
        })
      }

      // Generate a simple token-like response
      const token = Buffer.from(
        `${adminUser.id}:${adminUser.role}:${Date.now()}`
      ).toString('base64')

      return NextResponse.json({
        success: true,
        token,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          name: adminUser.name,
          role: adminUser.role,
          avatar: adminUser.avatar,
        },
      })
    }

    // Also allow login via existing admin users in the database
    const existingAdmin = await db.user.findFirst({
      where: {
        email,
        role: 'admin',
      },
    })

    if (existingAdmin && existingAdmin.password === password) {
      const token = Buffer.from(
        `${existingAdmin.id}:${existingAdmin.role}:${Date.now()}`
      ).toString('base64')

      return NextResponse.json({
        success: true,
        token,
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          username: existingAdmin.username,
          name: existingAdmin.name,
          role: existingAdmin.role,
          avatar: existingAdmin.avatar,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Superadmin auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
