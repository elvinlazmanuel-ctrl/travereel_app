'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Globe, Eye, EyeOff, Loader2, MapPin } from 'lucide-react'
import { getAllCountries } from '@/lib/countries-database'
import { detectUserLocation, storeDetectedLocation, getStoredLocation } from '@/lib/user-location'

const allCountries = getAllCountries()

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  // Auto-detect user's country on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // Check if we already have a stored location
      const stored = getStoredLocation()
      if (stored && stored.country) {
        setCountryOfOrigin(stored.country)
        return
      }

      // Detect location from IP
      setIsDetectingLocation(true)
      try {
        const location = await detectUserLocation()
        if (location && location.country !== 'Unknown') {
          setCountryOfOrigin(location.country)
          storeDetectedLocation(location)
        }
      } catch (error) {
        console.warn('Location detection failed:', error)
      } finally {
        setIsDetectingLocation(false)
      }
    }

    detectLocation()
  }, [])

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
          countryOfOrigin,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        setErrorDetails(data.details || null)
        return
      }

      login(data.user, data.token)
      // New users won't have blocks, but set empty arrays for consistency
      const store = useAppStore.getState()
      store.setBlockedIds([])
      store.setMutedIds([])
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
          Join Travereel
        </h1>
        <p className="text-sm text-[#4A5568] mt-2">
          Start your travel adventure today
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
          <Label htmlFor="reg-email" className="text-[#0B0B2A] font-medium">
            Email Address
          </Label>
          <Input
            id="reg-email"
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
          <Label htmlFor="reg-username" className="text-[#0B0B2A] font-medium">
            Username
          </Label>
          <Input
            id="reg-username"
            type="text"
            placeholder="Choose a unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 text-[#0B0B2A] placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-name" className="text-[#0B0B2A] font-medium">
            Full Name
          </Label>
          <Input
            id="reg-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 text-[#0B0B2A] placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-country" className="text-[#0B0B2A] font-medium">
            Country of Origin
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <select
              id="reg-country"
              value={countryOfOrigin}
              onChange={(e) => setCountryOfOrigin(e.target.value)}
              required
              className="h-12 w-full rounded-xl border-gray-300 bg-white focus:bg-white transition-all focus:border-[#2F5C9B] focus:ring-2 focus:ring-[#2F5C9B]/20 pl-10 pr-4 text-sm disabled:opacity-50 text-[#0B0B2A]"
              disabled={isLoading}
            >
              <option value="">Select your country</option>
              {allCountries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
          {isDetectingLocation && (
            <p className="text-xs text-[#4A5568] flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Detecting your location...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password" className="text-[#0B0B2A] font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white font-semibold shadow-lg hover:shadow-xl hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-4 text-xs text-gray-500 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Switch to Login */}
      <p className="text-center text-sm text-[#4A5568]">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-[#2F5C9B] font-semibold hover:text-[#5CA5CD] transition-colors underline-offset-4 hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  )
}
