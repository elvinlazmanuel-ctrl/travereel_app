/**
 * API Key Encryption Utility
 * Provides secure encryption/decryption for API keys stored in database
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Derive encryption key from the master key
 */
async function deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
  const derivedKey = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer
  return derivedKey
}

/**
 * Encrypt API key
 * Returns encrypted string with format: salt:iv:authTag:encryptedData
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  const masterKey = process.env.API_KEY_ENCRYPTION_SECRET || 'default-encryption-key-change-in-production'
  
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  
  // Derive encryption key
  const key = await deriveKey(masterKey, salt)
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt the API key
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get auth tag
  const authTag = cipher.getAuthTag()
  
  // Return formatted string: salt:iv:authTag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt API key
 * Accepts encrypted string with format: salt:iv:authTag:encryptedData
 */
export async function decryptApiKey(encryptedApiKey: string): Promise<string> {
  const masterKey = process.env.API_KEY_ENCRYPTION_SECRET || 'default-encryption-key-change-in-production'
  
  // Parse the encrypted string
  const [saltHex, ivHex, authTagHex, encrypted] = encryptedApiKey.split(':')
  
  if (!saltHex || !ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted API key format')
  }
  
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  // Derive encryption key
  const key = await deriveKey(masterKey, salt)
  
  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Mask API key for display (shows first 4 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 8) {
    return '••••••••'
  }
  
  const visibleStart = apiKey.substring(0, 4)
  const visibleEnd = apiKey.substring(apiKey.length - 4)
  const maskedMiddle = '•'.repeat(apiKey.length - 8)
  
  return `${visibleStart}${maskedMiddle}${visibleEnd}`
}

/**
 * Validate API key format (basic validation)
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false
  }
  
  // Minimum length check
  if (apiKey.length < 8) {
    return false
  }
  
  return true
}
