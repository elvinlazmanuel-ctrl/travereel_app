import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth-jwt'
import { db } from '@/lib/db'

/**
 * Middleware to protect superadmin API routes
 * Verifies JWT token and checks admin role
 */
export async function requireSuperAdmin(request: NextRequest): Promise<{
  success: boolean
  userId?: string
  email?: string
  role?: string
  error?: NextResponse
}> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        ),
      }
    }

    // Check if user still exists and has admin role
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
      },
    })

    if (!user) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        ),
      }
    }

    if (user.isBanned) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Account has been banned' },
          { status: 403 }
        ),
      }
    }

    // TODO: Add lockedUntil check after Prisma types are regenerated

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    return {
      success: true,
      userId: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error('Middleware error:', error)
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Helper to get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return 'unknown'
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}
