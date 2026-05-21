import jwt, { SignOptions } from 'jsonwebtoken'

// Throw error in production if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}

const SECRET_KEY = JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Generate a signed JWT token for authenticated users
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: '24h',
  } as SignOptions)
}

/**
 * Verify and decode a JWT token
 * Returns the payload if valid, null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token decoding failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
