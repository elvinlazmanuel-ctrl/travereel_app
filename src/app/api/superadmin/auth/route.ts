import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { loginSchema, validateBody } from '@/lib/validation'
import { hashPassword, comparePassword } from '@/lib/auth-utils'
import { generateToken } from '@/lib/auth-jwt'
import { logAdminAction } from '@/lib/audit-logger'

// Use environment variables instead of hardcoded credentials
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@travereel.com'

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

    // Get client info for logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Find admin user
    const adminUser = await db.user.findFirst({
      where: {
        email,
        role: 'admin',
      },
    })

    if (!adminUser) {
      // Log failed attempt
      await logAdminAction({
        adminId: 'unknown',
        action: 'LOGIN_ATTEMPT',
        details: JSON.stringify({ email, reason: 'user_not_found' }),
        ipAddress: ip,
        userAgent,
        outcome: 'failed',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Compare password with bcrypt
    const isPasswordValid = await comparePassword(password, adminUser.password)

    if (!isPasswordValid) {
      // Log failed attempt
      await logAdminAction({
        adminId: adminUser.id,
        action: 'LOGIN_ATTEMPT',
        details: JSON.stringify({ email, reason: 'invalid_password' }),
        ipAddress: ip,
        userAgent,
        outcome: 'failed',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Successful login - update last login info
    await db.user.update({
      where: { id: adminUser.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    })

    // Log successful login
    await logAdminAction({
      adminId: adminUser.id,
      action: 'LOGIN',
      ipAddress: ip,
      userAgent,
      outcome: 'success',
    })

    // Return token in HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        avatar: adminUser.avatar,
      },
    })

    // Set HttpOnly cookie
    response.cookies.set('superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Superadmin auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Initialize superadmin on first run
export async function GET() {
  try {
    const existingAdmin = await db.user.findFirst({
      where: { email: SUPERADMIN_EMAIL },
    })

    if (!existingAdmin) {
      // Create initial superadmin with hashed password
      const initialPassword = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!'
      const hashedPassword = await hashPassword(initialPassword)

      await db.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          username: 'superadmin',
          name: 'Super Admin',
          password: hashedPassword,
          role: 'admin',
          isPrivate: false,
        },
      })

      return NextResponse.json({
        message: 'Initial superadmin account created with hashed password',
        email: SUPERADMIN_EMAIL,
      })
    }

    return NextResponse.json({
      message: 'Superadmin account exists',
      email: SUPERADMIN_EMAIL,
    })
  } catch (error) {
    console.error('Error initializing superadmin:', error)
    return NextResponse.json(
      { error: 'Failed to initialize' },
      { status: 500 }
    )
  }
}
