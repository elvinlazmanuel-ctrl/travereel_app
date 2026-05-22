/**
 * Friend Suggestions Algorithm
 * 
 * Suggests friends based on:
 * - Mutual friends count (primary signal)
 * - Shared interests/activities
 * - Recent activity overlap
 * - Geographic proximity (if available)
 */

export interface FriendSuggestion {
  userId: string
  username: string
  name: string
  avatar: string | null
  mutualFriendsCount: number
  mutualFriends: Array<{
    id: string
    username: string
    name: string
    avatar: string | null
  }>
  score: number
  reason: string
}

interface UserWithFriends {
  id: string
  username: string
  name: string
  avatar: string | null
  friendIds: Set<string>
}

/**
 * Calculate mutual friends between two users
 */
export function calculateMutualFriends(
  user1FriendIds: Set<string>,
  user2FriendIds: Set<string>
): string[] {
  const mutuals: string[] = []
  
  user1FriendIds.forEach(friendId => {
    if (user2FriendIds.has(friendId)) {
      mutuals.push(friendId)
    }
  })
  
  return mutuals
}

/**
 * Calculate suggestion score based on multiple factors
 */
export function calculateSuggestionScore(
  mutualFriendsCount: number,
  hasSharedInterests: boolean = false,
  hasRecentActivityOverlap: boolean = false,
  isGeographicallyClose: boolean = false
): number {
  let score = 0
  
  // Mutual friends (0-0.6 range) - strongest signal
  score += Math.min(0.6, mutualFriendsCount * 0.1)
  
  // Shared interests (0-0.2)
  if (hasSharedInterests) score += 0.2
  
  // Recent activity overlap (0-0.1)
  if (hasRecentActivityOverlap) score += 0.1
  
  // Geographic proximity (0-0.1)
  if (isGeographicallyClose) score += 0.1
  
  return Math.min(1, score)
}

/**
 * Generate friend suggestions
 */
export function generateFriendSuggestions(
  userId: string,
  userFriends: UserWithFriends,
  potentialFriends: UserWithFriends[],
  mutualFriendsData: Map<string, Array<{id: string, username: string, name: string, avatar: string | null}>>
): FriendSuggestion[] {
  const suggestions: FriendSuggestion[] = []
  
  for (const potential of potentialFriends) {
    // Skip if already friends or is the user themselves
    if (userFriends.friendIds.has(potential.id) || potential.id === userId) {
      continue
    }
    
    // Calculate mutual friends
    const mutualFriendIds = calculateMutualFriends(
      userFriends.friendIds,
      potential.friendIds
    )
    
    // Skip if no mutual friends
    if (mutualFriendIds.length === 0) continue
    
    // Get mutual friends details
    const mutualFriends = mutualFriendsData.get(potential.id) || []
    
    // Calculate score
    const score = calculateSuggestionScore(mutualFriendIds.length)
    
    // Generate reason
    let reason = ''
    if (mutualFriendIds.length >= 5) {
      reason = `You have ${mutualFriendIds.length} mutual friends`
    } else if (mutualFriendIds.length >= 3) {
      reason = `You have ${mutualFriendIds.length} mutual friends`
    } else {
      const mutualNames = mutualFriends.slice(0, 2).map(m => m.name).join(' and ')
      reason = `Friends with ${mutualNames}`
    }
    
    suggestions.push({
      userId: potential.id,
      username: potential.username,
      name: potential.name,
      avatar: potential.avatar,
      mutualFriendsCount: mutualFriendIds.length,
      mutualFriends: mutualFriends.slice(0, 3), // Show top 3
      score,
      reason,
    })
  }
  
  // Sort by score descending, then by mutual friends count
  return suggestions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.mutualFriendsCount - a.mutualFriendsCount
  })
}

/**
 * Get second-degree connections (friends of friends)
 */
export function getSecondDegreeConnections(
  userId: string,
  userFriends: UserWithFriends[],
  allUsersFriends: Map<string, Set<string>>
): string[] {
  const secondDegree = new Map<string, number>()
  
  // For each friend, get their friends
  userFriends.forEach(friend => {
    const friendsFriends = allUsersFriends.get(friend.id) || new Set()
    
    friendsFriends.forEach(friendOfFriendId => {
      // Skip if already direct friends or is the user
      if (friendOfFriendId === userId) return
      if (userFriends.some(f => f.id === friendOfFriendId)) return
      
      // Count occurrences (more occurrences = more mutual friends)
      secondDegree.set(
        friendOfFriendId,
        (secondDegree.get(friendOfFriendId) || 0) + 1
      )
    })
  })
  
  // Sort by mutual friend count
  return Array.from(secondDegree.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([userId]) => userId)
}
