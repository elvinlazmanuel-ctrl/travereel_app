import jwt from 'jsonwebtoken'

// Throw error in production if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}

const SECRET_KEY = JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRATION = '7d' // Token expires in 7 days

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: JWT_EXPIRATION,
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as JWTPayload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.split(' ')[1]
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}
