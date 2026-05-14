/**
 * Email Service
 * Supports multiple providers: Resend, SendGrid, SMTP
 * For development: logs emails to console
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email
 * In production, integrate with Resend, SendGrid, or SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email service is configured
    if (process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
      // Production: Send real email
      return await sendProductionEmail(options)
    } else {
      // Development: Log email to console
      console.log('\n' + '='.repeat(60))
      console.log('📧 EMAIL (Development Mode)')
      console.log('='.repeat(60))
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      console.log('Body:')
      console.log(options.html)
      console.log('='.repeat(60) + '\n')
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return true
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Production email sending with Resend
 */
async function sendProductionEmail(options: EmailOptions): Promise<boolean> {
  // Resend integration (recommended)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wanderlust <noreply@yourdomain.com>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    })

    if (!res.ok) {
      throw new Error(`Resend API error: ${res.statusText}`)
    }

    return true
  }

  // SMTP integration (alternative)
  if (process.env.SMTP_HOST) {
    // TODO: Implement with nodemailer
    console.log('SMTP email sending not yet implemented')
    return false
  }

  throw new Error('No email service configured')
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  verificationLink: string
): Promise<boolean> {
  const { emailTemplates } = await import('./email-utils')
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Wanderlust',
    html: emailTemplates.verification(userName, verificationLink),
    text: `Hi ${userName}!\n\nPlease verify your email by clicking: ${verificationLink}\n\nThis link expires in 24 hours.`,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  const { emailTemplates } = await import('./email-utils')
  
  return sendEmail({
    to: email,
    subject: 'Password Reset Request - Wanderlust',
    html: emailTemplates.passwordReset(userName, resetLink),
    text: `Hi ${userName}!\n\nReset your password by clicking: ${resetLink}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can ignore this email.`,
  })
}
