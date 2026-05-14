import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/jwt'
import { db } from '@/lib/db'

export interface AuthenticatedRequest extends NextRequest {
  userId?: string
  userEmail?: string
  userRole?: string
}

/**
 * Middleware to authenticate API routes
 * Usage: In API route, call this to get authenticated user
 */
export async function authenticateUser(
  request: NextRequest
): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = request.headers.get('authorization')
  const token = getTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // Verify user still exists and is not banned
  const user = await db.user.findUnique({
    where: { id: payload.userId },
  })

  if (!user || user.isBanned) {
    return null
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * Helper to return forbidden response
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

/**
 * Require admin role
 */
export function requireAdmin(role: string): boolean {
  return role === 'admin' || role === 'superadmin'
}
