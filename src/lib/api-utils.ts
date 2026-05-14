import { NextResponse } from 'next/server'
import { checkRateLimit, DEFAULT_OPTIONS, STRICT_OPTIONS, AUTH_OPTIONS } from './rate-limit'

export function getRateLimitKey(request: Request, suffix?: string): string {
  // Use IP from headers or a fallback
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return suffix ? `${ip}:${suffix}` : ip
}

export function withRateLimit(
  request: Request,
  category: 'default' | 'strict' | 'auth' = 'default'
): NextResponse | null {
  const key = getRateLimitKey(request, category)
  const options = category === 'auth' ? AUTH_OPTIONS : category === 'strict' ? STRICT_OPTIONS : DEFAULT_OPTIONS
  const result = checkRateLimit(key, options)
  
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
        }
      }
    )
  }
  
  return null // No rate limit hit, continue
}
