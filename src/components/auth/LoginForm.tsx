'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] shadow-lg mb-4">
          <Plane className="size-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] bg-clip-text text-transparent">
          Wanderlust
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your travel adventures
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
            <p className="text-sm text-[#FF6B6B]">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-lg bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] text-white font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all border-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-4 text-xs text-gray-400 uppercase">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Switch to Register */}
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-[#FF8C42] font-semibold hover:text-[#FF6B6B] transition-colors"
        >
          Sign Up
        </button>
      </p>
    </div>
  )
}
