/**
 * Enhanced Search Algorithm with Full-Text Support
 * 
 * Features:
 * - Fuzzy matching with typo tolerance
 * - Relevance scoring
 * - Multi-field search
 * - Search result ranking
 * - Autocomplete suggestions
 */

export interface SearchResult<T = any> {
  id: string
  type: 'user' | 'post' | 'itinerary' | 'location'
  title: string
  description: string
  imageUrl?: string | null
  relevanceScore: number
  metadata: T
}

export interface SearchQuery {
  query: string
  types?: Array<'user' | 'post' | 'itinerary' | 'location'>
  limit?: number
  userId?: string // For personalized results
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 * Returns the number of edits needed to transform string a to string b
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Check if two strings match with fuzzy tolerance
 * Allows up to 2 character differences for short strings, 3 for longer
 */
export function fuzzyMatch(text: string, pattern: string): boolean {
  const lowerText = text.toLowerCase()
  const lowerPattern = pattern.toLowerCase()

  // Exact match
  if (lowerText.includes(lowerPattern)) return true

  // Fuzzy match for short patterns
  if (lowerPattern.length <= 5) {
    return levenshteinDistance(lowerText, lowerPattern) <= 2
  }

  // More tolerance for longer patterns
  return levenshteinDistance(lowerText, lowerPattern) <= 3
}

/**
 * Calculate text relevance score (0-1)
 * Higher score = better match
 */
export function calculateRelevanceScore(
  text: string,
  query: string,
  isExactMatch: boolean = false
): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match gets highest score
  if (lowerText === lowerQuery) return 1.0

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) return 0.9

  // Contains exact query
  if (lowerText.includes(lowerQuery)) {
    const position = lowerText.indexOf(lowerQuery)
    const lengthRatio = lowerQuery.length / lowerText.length
    
    // Earlier match + longer query portion = higher score
    return 0.7 + (lengthRatio * 0.2) - (position * 0.001)
  }

  // Fuzzy match
  const distance = levenshteinDistance(lowerText, lowerQuery)
  const maxLen = Math.max(lowerText.length, lowerQuery.length)
  const similarity = 1 - (distance / maxLen)

  return similarity * 0.6 // Lower score for fuzzy matches
}

/**
 * Tokenize search query into individual terms
 * Handles quotes for exact phrase matching
 */
export function tokenizeQuery(query: string): {
  exactPhrases: string[]
  terms: string[]
} {
  const exactPhrases: string[] = []
  const terms: string[] = []

  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g
  let match
  while ((match = phraseRegex.exec(query)) !== null) {
    exactPhrases.push(match[1])
  }

  // Remove quotes and split into terms
  const cleanQuery = query.replace(/"/g, '')
  const allTerms = cleanQuery.split(/\s+/).filter(Boolean)

  // Remove exact phrases from terms
  terms.push(...allTerms.filter(term => !exactPhrases.includes(term)))

  return { exactPhrases, terms }
}

/**
 * Rank search results by relevance
 */
export function rankSearchResults<T>(
  results: SearchResult<T>[]
): SearchResult<T>[] {
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .filter(r => r.relevanceScore > 0.3) // Filter low relevance
}

/**
 * Generate autocomplete suggestions
 */
export function generateAutocompleteSuggestions(
  query: string,
  options: string[],
  limit: number = 5
): string[] {
  const lowerQuery = query.toLowerCase()

  // Score each option
  const scored = options
    .map(option => {
      const lowerOption = option.toLowerCase()
      let score = 0

      // Exact match
      if (lowerOption === lowerQuery) score = 1.0
      // Starts with query
      else if (lowerOption.startsWith(lowerQuery)) score = 0.9
      // Contains query
      else if (lowerOption.includes(lowerQuery)) score = 0.7
      // Fuzzy match
      else if (fuzzyMatch(lowerOption, lowerQuery)) score = 0.5

      return { option, score }
    })
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(s => s.option)
}

/**
 * Multi-field search scorer
 * Searches across multiple fields and returns best match score
 */
export function multiFieldSearch(
  query: string,
  fields: Record<string, string | null | undefined>,
  fieldWeights: Record<string, number> = {}
): number {
  const { exactPhrases, terms } = tokenizeQuery(query)
  let maxScore = 0

  // Check exact phrases first (highest priority)
  for (const phrase of exactPhrases) {
    for (const [field, value] of Object.entries(fields)) {
      if (!value) continue
      
      const weight = fieldWeights[field] || 1.0
      const score = calculateRelevanceScore(value, phrase, true) * weight
      
      if (score > maxScore) {
        maxScore = score
      }
    }
  }

  // Check individual terms
  for (const term of terms) {
    for (const [field, value] of Object.entries(fields)) {
      if (!value) continue
      
      const weight = fieldWeights[field] || 1.0
      const score = calculateRelevanceScore(value, term) * weight
      
      if (score > maxScore) {
        maxScore = score
      }
    }
  }

  return maxScore
}

/**
 * Search result deduplication
 * Removes duplicates based on ID
 */
export function deduplicateResults<T>(
  results: SearchResult<T>[]
): SearchResult<T>[] {
  const seen = new Set<string>()
  return results.filter(result => {
    if (seen.has(result.id)) return false
    seen.add(result.id)
    return true
  })
}

/**
 * Personalize search results based on user history
 * Boosts results matching user preferences
 */
export function personalizeSearchResults<T>(
  results: SearchResult<T>[],
  userId: string,
  userPreferences: {
    preferredCountries?: Set<string>
    preferredLocations?: Set<string>
    interactionHistory?: Record<string, number>
  }
): SearchResult<T>[] {
  return results.map(result => {
    let boost = 0

    // Boost by preferred countries
    if (userPreferences.preferredCountries) {
      const country = (result.metadata as any)?.country
      if (country && userPreferences.preferredCountries.has(country)) {
        boost += 0.2
      }
    }

    // Boost by preferred locations
    if (userPreferences.preferredLocations) {
      const location = (result.metadata as any)?.location
      if (location && userPreferences.preferredLocations.has(location)) {
        boost += 0.15
      }
    }

    // Boost by interaction history
    if (userPreferences.interactionHistory) {
      const itemId = result.id
      const interactions = userPreferences.interactionHistory[itemId] || 0
      boost += Math.min(0.1, interactions * 0.02)
    }

    // Apply boost (cap at 1.0)
    result.relevanceScore = Math.min(1.0, result.relevanceScore + boost)

    return result
  })
}
