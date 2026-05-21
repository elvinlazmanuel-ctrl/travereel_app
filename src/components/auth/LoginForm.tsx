'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
}

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.')
        setErrorDetails(data.details || null)
        return
      }

      login(data.user, data.token)

      // Fetch blocked/muted IDs for the current user
      try {
        const blocksRes = await fetch(`/api/blocks?userId=${data.user.id}`)
        if (blocksRes.ok) {
          const blocksData = await blocksRes.json()
          const blockedIds = (blocksData.blocks || []).filter((b: { type: string }) => b.type === 'block').map((b: { blockedId: string }) => b.blockedId)
          const mutedIds = (blocksData.blocks || []).filter((b: { type: string }) => b.type === 'mute').map((b: { blockedId: string }) => b.blockedId)
          const store = useAppStore.getState()
          store.setBlockedIds(blockedIds)
          store.setMutedIds(mutedIds)
        }
      } catch {
        // Non-critical
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setErrorDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6 py-8">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center mb-4 bg-white rounded-2xl p-3 shadow-sm">
          <img src="/new-logo.png" alt="Travereel" className="h-16 w-16 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-[#0B0B2A]">
          Welcome Back
        </h1>
        <p className="text-sm text-[#4A5568] mt-2">
          Sign in to continue your travel journey
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            {errorDetails && (
              <p className="text-xs text-red-600 mt-1">{errorDetails}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[#0B0B2A] font-medium">
            Email Address
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 text-[#0B0B2A] placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-[#0B0B2A] font-medium">
            Password
          </Label>
          <div className="flex justify-between items-center mb-2">
            <div className="relative flex-1">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 text-[#0B0B2A] placeholder:text-gray-400 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2F5C9B] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-[#2F5C9B] hover:text-[#5CA5CD] transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white font-semibold shadow-lg hover:shadow-xl hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-4 text-xs text-gray-500 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Switch to Register */}
      <p className="text-center text-sm text-[#4A5568]">
        Don&apos;t have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-[#2F5C9B] font-semibold hover:text-[#5CA5CD] transition-colors underline-offset-4 hover:underline"
        >
          Create Account
        </button>
      </p>
    </div>
  )
}
