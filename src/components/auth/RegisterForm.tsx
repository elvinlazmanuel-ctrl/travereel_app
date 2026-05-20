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
    <div className="w-full max-w-sm mx-auto px-6">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img src="/new-logo.png" alt="Travereel" className="h-15 w-16" />
        </div>
        <h1 className="text-3xl font-bold text-gradient-sky">
          Travereel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Start your journey today
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[#2F5C9B]/10 border border-[#2F5C9B]/20">
            <p className="text-sm text-[#2F5C9B] font-medium">{error}</p>
            {errorDetails && (
              <p className="text-xs text-[#2F5C9B]/80 mt-1">{errorDetails}</p>
            )}
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
          <Label htmlFor="reg-country" className="text-gray-700">
            Country of Origin
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <select
              id="reg-country"
              value={countryOfOrigin}
              onChange={(e) => setCountryOfOrigin(e.target.value)}
              required
              className="h-11 w-full rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors pl-10 pr-4 text-sm disabled:opacity-50"
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
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Detecting your location...
            </p>
          )}
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
          className="w-full h-11 rounded-lg bg-gradient-to-r from-[#2F5C9B] via-[#5CA5CD] to-[#2F5C9B] text-white font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all border-0 disabled:opacity-50 cursor-pointer"
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
          className="text-[#5CA5CD] font-semibold hover:text-[#2F5C9B] transition-colors"
        >
          Log In
        </button>
      </p>
    </div>
  )
}
