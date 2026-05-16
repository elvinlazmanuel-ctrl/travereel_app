import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit-logger'
import { verifyToken } from '@/lib/auth-jwt'

/**
 * Logout endpoint - clears the HttpOnly cookie
 */
export async function POST(request: Request) {
  try {
    // Try to get the token for logging
    const cookieHeader = request.headers.get('cookie')
    let adminId = 'unknown'

    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/superadmin_token=([^;]+)/)
      if (tokenMatch) {
        const payload = verifyToken(tokenMatch[1])
        if (payload) {
          adminId = payload.userId
        }
      }
    }

    // Log the logout
    await logAdminAction({
      adminId,
      action: 'LOGOUT',
      outcome: 'success',
    })

    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    })

    // Clear the HttpOnly cookie
    response.cookies.set('superadmin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
