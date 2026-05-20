import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, loginSchema, registerSchema } from '@/lib/validation'
import { hashPassword, comparePassword, validatePasswordStrength } from '@/lib/auth-helpers'
import { generateToken } from '@/lib/jwt'
import { generateToken as generateRandomToken, TOKEN_EXPIRY_HOURS } from '@/lib/email-utils'
import { sendVerificationEmail } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    // Rate limit auth operations
    const rateLimitResponse = withRateLimit(request, 'auth')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      const validation = validateBody(registerSchema, body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      const { email, password, username, name, countryOfOrigin } = validation.data

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: 'Password too weak', details: passwordValidation.errors },
          { status: 400 }
        )
      }

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email or username already taken' },
          { status: 409 }
        )
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await db.user.create({
        data: {
          email,
          username,
          name,
          password: hashedPassword,
          avatar: null,
          bio: null,
          isPrivate: false,
          countryOfOrigin: countryOfOrigin || null,
        },
      })

      // Generate email verification token
      const verificationToken = generateRandomToken()
      const verificationExpires = new Date()
      verificationExpires.setHours(verificationExpires.getHours() + TOKEN_EXPIRY_HOURS)

      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      })

      // Send verification email (will log in development)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await sendVerificationEmail(
        email,
        name,
        `${baseUrl}/verify-email?token=${verificationToken}`
      )

      return NextResponse.json({
        user: formatUser(user),
        token: generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }),
        message: 'Registration successful! Please check your email to verify your account.',
      })
    }

    if (action === 'login') {
      const validation = validateBody(loginSchema, body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      const { email, password } = validation.data

      // Find user by email
      const user = await db.user.findUnique({
        where: { email },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Compare password with hash
      const isValidPassword = await comparePassword(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (user.isBanned) {
        return NextResponse.json(
          { error: 'This account has been suspended' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        user: formatUser(user),
        token: generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }),
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "login" or "register"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Verify token endpoint
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { verifyToken } = await import('@/lib/jwt')
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get fresh user data
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.isBanned) {
      return NextResponse.json(
        { error: 'User not found or banned' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: formatUser(user),
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatUser(user: {
  id: string
  email: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
  isPrivate: boolean
  isBanned: boolean
  role: string
  currency: string
  travelType: string
  language: string
  notificationsEnabled: boolean
  activityStatus: boolean
  darkMode: boolean
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    isPrivate: user.isPrivate,
    isBanned: user.isBanned,
    role: user.role,
    currency: user.currency,
    travelType: user.travelType,
    language: user.language,
    notificationsEnabled: user.notificationsEnabled,
    activityStatus: user.activityStatus,
    darkMode: user.darkMode,
  }
}
