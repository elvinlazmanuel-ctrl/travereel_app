import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-helpers'
import { generateToken, hashToken, isTokenExpired, TOKEN_EXPIRY_HOURS } from '@/lib/email-utils'
import { sendPasswordResetEmail } from '@/lib/email-service'

/**
 * POST /api/password-reset/request
 * Request password reset email
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

    // Find user (don't reveal if user exists or not for security)
    const user = await db.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = generateToken()
    const hashedToken = hashToken(resetToken)
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + TOKEN_EXPIRY_HOURS)

    // Save hashed token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      },
    })

    // Send password reset email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`
    
    await sendPasswordResetEmail(user.email, user.name, resetLink)

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/password-reset/confirm
 * Confirm password reset with token
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const { validatePasswordStrength } = await import('@/lib/auth-helpers')
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashToken(token)

    // Find user with this reset token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (user.passwordResetExpires && isTokenExpired(user.passwordResetExpires)) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    return NextResponse.json({
      message: 'Password reset successful! You can now login with your new password.',
    })
  } catch (error) {
    console.error('Password reset confirm error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
