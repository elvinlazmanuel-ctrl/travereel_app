import crypto from 'crypto'

/**
 * Generate a random token for email verification/password reset
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate email verification link
 */
export function generateVerificationLink(token: string, baseUrl: string): string {
  return `${baseUrl}/verify-email?token=${token}`
}

/**
 * Generate password reset link
 */
export function generatePasswordResetLink(token: string, baseUrl: string): string {
  return `${baseUrl}/reset-password?token=${token}`
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Token expiration: 24 hours
 */
export const TOKEN_EXPIRY_HOURS = 24

/**
 * Email templates
 */
export const emailTemplates = {
  verification: (userName: string, link: string) => `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B6B, #FF8C42); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Wanderlust! 🌍</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Hi ${userName}!</h2>
          <p>Thank you for joining Wanderlust - your travel social network.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background: #FF8C42; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${link}">${link}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in ${TOKEN_EXPIRY_HOURS} hours.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `,

  passwordReset: (userName: string, link: string) => `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2EC4B6, #FFBA49); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request 🔐</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Hi ${userName}!</h2>
          <p>We received a request to reset your password for your Wanderlust account.</p>
          <p>Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background: #2EC4B6; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${link}">${link}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in ${TOKEN_EXPIRY_HOURS} hours.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
        </div>
      </body>
    </html>
  `,
}
