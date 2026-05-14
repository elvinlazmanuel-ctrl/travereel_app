'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Globe, Eye, EyeOff, Loader2 } from 'lucide-react'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
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
        body: JSON.stringify({
          action: 'register',
          email,
          username,
          name,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        return
      }

      login(data.user, data.token)
      // New users won't have blocks, but set empty arrays for consistency
      const store = useAppStore.getState()
      store.setBlockedIds([])
      store.setMutedIds([])
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
        <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[#2EC4B6] via-[#FFBA49] to-[#FF8C42] shadow-lg mb-4">
          <Globe className="size-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2EC4B6] via-[#FF8C42] to-[#FFBA49] bg-clip-text text-transparent">
          Travereel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Start your journey today
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
          <Label htmlFor="reg-email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="reg-email"
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
          <Label htmlFor="reg-username" className="text-gray-700">
            Username
          </Label>
          <Input
            id="reg-username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-name" className="text-gray-700">
            Full Name
          </Label>
          <Input
            id="reg-name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password" className="text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
              Creating account...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-4 text-xs text-gray-400 uppercase">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Switch to Login */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-[#FF8C42] font-semibold hover:text-[#FF6B6B] transition-colors"
        >
          Log In
        </button>
      </p>
    </div>
  )
}
