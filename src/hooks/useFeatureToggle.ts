import { useState, useEffect, useCallback } from 'react'

export interface FeatureToggle {
  id: string
  key: string
  label: string
  description: string | null
  enabled: boolean
  category: string
  apiKey: string | null // Masked API key
  apiConfig: string | null // JSON string
  metadata: string | null // JSON string
}

/**
 * Hook to check if a specific feature is enabled
 * 
 * @param key - The feature toggle key (e.g., 'where_to_stay', 'travel_insurance')
 * @returns Object with enabled status, feature data, and loading state
 * 
 * @example
 * ```tsx
 * function HotelBookingWidget() {
 *   const { enabled, loading } = useFeatureToggle('where_to_stay')
 *   
 *   if (loading) return <Skeleton />
 *   if (!enabled) return null
 *   
 *   return <div>Hotel booking content...</div>
 * }
 * ```
 */
export function useFeatureToggle(key: string) {
  const [feature, setFeature] = useState<FeatureToggle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeature = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/superadmin/features', {
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const foundFeature = data.features?.find((f: FeatureToggle) => f.key === key)
      
      setFeature(foundFeature || null)
    } catch (err) {
      console.error(`Failed to fetch feature toggle "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Default to disabled if we can't fetch the feature
      setFeature(null)
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    fetchFeature()
  }, [fetchFeature])

  return {
    enabled: feature?.enabled ?? false,
    feature,
    loading,
    error,
    refetch: fetchFeature,
  }
}

/**
 * Hook to fetch all feature toggles at once
 * 
 * @returns Object with features array, grouped features, categories, and loading state
 * 
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { features, grouped, loading } = useAllFeatureToggles()
 *   
 *   if (loading) return <Skeleton />
 *   
 *   return (
 *     <div>
 *       {grouped.monetization?.map(feature => (
 *         <FeatureCard key={feature.key} feature={feature} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAllFeatureToggles() {
  const [features, setFeatures] = useState<FeatureToggle[]>([])
  const [grouped, setGrouped] = useState<Record<string, FeatureToggle[]>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/superadmin/features', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setFeatures(data.features || [])
      setGrouped(data.grouped || {})
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch feature toggles:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setFeatures([])
      setGrouped({})
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  return {
    features,
    grouped,
    categories,
    loading,
    error,
    refetch: fetchFeatures,
  }
}
