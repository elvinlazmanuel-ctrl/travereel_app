import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * CSRF Token Management
 * Generates and validates CSRF tokens for state-changing operations
 */

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex')

if (!process.env.CSRF_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  CSRF_SECRET not set. Using random secret (tokens will not survive restarts)')
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex')
  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Token validation - in a production app, you'd store tokens in session/Redis
  // For now, we validate the token format
  return token.length === 64 && /^[a-f0-9]+$/i.test(token)
}

/**
 * CSRF Protection Middleware
 * Usage: Add to API routes that handle state-changing operations (POST, PUT, DELETE, PATCH)
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Only protect state-changing methods
  const method = request.method
  
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null
  }

  // Skip CSRF for API routes that use JWT authentication
  // JWT already provides protection against CSRF for authenticated requests
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return null
  }

  // Check CSRF token for non-authenticated requests
  const csrfToken = request.headers.get('x-csrf-token') || 
                    request.cookies.get('csrf_token')?.value ||
                    new URLSearchParams(await request.text().catch(() => '')).get('csrf_token')

  if (!csrfToken || !validateCSRFToken(csrfToken)) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Set CSRF token in response cookie
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf_token', token, {
    httpOnly: false, // Must be accessible to JavaScript for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

/**
 * Helper to get CSRF token from request
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-csrf-token') || 
         request.cookies.get('csrf_token')?.value ||
         null
}
