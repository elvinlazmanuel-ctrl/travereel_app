import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashPassword, comparePassword, validatePasswordStrength, generateSecureToken } from '@/lib/auth-utils'

describe('Auth Utilities', () => {
  describe('hashPassword & comparePassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should verify a correct password', async () => {
      const password = 'SecurePassword456!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword789!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'SamePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should accept a strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd123!')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject a weak password', () => {
      const result = validatePasswordStrength('weak')
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing uppercase', () => {
      const result = validatePasswordStrength('nouppercase123!')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Must contain at least one uppercase letter')
    })

    it('should detect missing numbers', () => {
      const result = validatePasswordStrength('NoNumbers!')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Must contain at least one number')
    })
  })

  describe('generateSecureToken', () => {
    it('should generate a token of specified length', () => {
      const token = generateSecureToken(32)
      
      expect(token).toBeDefined()
      expect(token.length).toBe(32)
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken(32)
      const token2 = generateSecureToken(32)
      
      expect(token1).not.toBe(token2)
    })

    it('should generate URL-safe tokens', () => {
      const token = generateSecureToken(64)
      
      // Should only contain alphanumeric characters
      expect(token).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })
})
