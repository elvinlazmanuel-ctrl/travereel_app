'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto px-6 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-4 bg-white rounded-2xl p-3 shadow-sm">
            <CheckCircle className="size-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B0B2A] text-center">
            Check Your Email
          </h1>
          <p className="text-sm text-[#4A5568] mt-2 text-center">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex gap-3">
              <Mail className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Didn&apos;t receive the email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Check your spam folder</li>
                  <li>Wait a few minutes</li>
                  <li>Make sure the email is correct</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={onBackToLogin}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0 cursor-pointer"
          >
            Back to Login
          </Button>

          <button
            onClick={() => setSuccess(false)}
            className="w-full text-sm text-[#2F5C9B] hover:text-[#5CA5CD] transition-colors"
          >
            Resend email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6 py-8">
      {/* Back Button */}
      <button
        onClick={onBackToLogin}
        className="flex items-center gap-2 text-sm text-[#4A5568] hover:text-[#2F5C9B] transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to Login
      </button>

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center mb-4 bg-white rounded-2xl p-3 shadow-sm">
          <Mail className="size-12 text-[#2F5C9B]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0B0B2A]">
          Forgot Password?
        </h1>
        <p className="text-sm text-[#4A5568] mt-2 text-center">
          No worries! Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex gap-2">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-[#0B0B2A] font-medium">
            Email Address
          </Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 text-[#0B0B2A] placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white font-semibold shadow-lg hover:shadow-xl hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-[#4A5568] mt-6">
        Remember your password?{' '}
        <button
          onClick={onBackToLogin}
          className="text-[#2F5C9B] font-semibold hover:text-[#5CA5CD] transition-colors underline-offset-4 hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  )
}
