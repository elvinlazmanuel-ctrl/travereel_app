import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isTokenExpired } from '@/lib/email-utils'

/**
 * GET /api/verify-email?token=xxx
 * Verify user's email address
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with this verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (user.emailVerificationExpires && isTokenExpired(user.emailVerificationExpires)) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      )
    }

    // Update user to verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    })

    // Return success with redirect URL for frontend
    return NextResponse.json({
      message: 'Email verified successfully!',
      success: true,
      userId: user.id,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/verify-email/resend
 * Resend verification email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      )
    }

    // Generate new verification token
    const { generateToken, TOKEN_EXPIRY_HOURS } = await import('@/lib/email-utils')
    const { sendVerificationEmail } = await import('@/lib/email-service')
    
    const verificationToken = generateToken()
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + TOKEN_EXPIRY_HOURS)

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    })

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    await sendVerificationEmail(
      user.email,
      user.name,
      `${baseUrl}/verify-email?token=${verificationToken}`
    )

    return NextResponse.json({
      message: 'Verification email sent!',
    })
  } catch (error) {
    console.error('Resend verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
