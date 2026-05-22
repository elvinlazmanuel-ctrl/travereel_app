/**
 * Feed Ranking Algorithm
 * 
 * Scores posts based on:
 * - Engagement (likes, comments, shares)
 * - Recency (exponential decay)
 * - User affinity (if following author)
 * - Content quality score
 */

export interface RankedPost {
  postId: string
  score: number
  engagementScore: number
  recencyScore: number
  affinityScore: number
  qualityScore: number
}

interface PostMetrics {
  id: string
  likesCount: number
  commentsCount: number
  createdAt: Date
  authorId: string
  hasImage: boolean
  captionLength: number
}

/**
 * Calculate exponential decay for recency scoring
 * Half-life: 6 hours (posts lose 50% recency score every 6 hours)
 */
export function calculateRecencyScore(createdAt: Date): number {
  const now = new Date()
  const hoursSincePost = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  
  // Exponential decay with 6-hour half-life
  const halfLife = 6
  return Math.pow(0.5, hoursSincePost / halfLife)
}

/**
 * Calculate engagement score
 * Weights: likes (1x), comments (3x), shares (5x)
 */
export function calculateEngagementScore(
  likes: number,
  comments: number,
  shares: number = 0
): number {
  const rawScore = (likes * 1) + (comments * 3) + (shares * 5)
  
  // Logarithmic scaling to prevent viral posts from dominating
  return Math.log(1 + rawScore) / Math.log(10)
}

/**
 * Calculate user affinity score
 * Higher if user follows the author or frequently interacts
 */
export function calculateAffinityScore(
  viewerId: string,
  authorId: string,
  isFollowing: boolean,
  interactionHistory: number = 0
): number {
  let score = 0.1 // Base score
  
  if (isFollowing) {
    score += 0.4 // Following gives significant boost
  }
  
  // Add interaction history (0-0.3 range)
  score += Math.min(0.3, interactionHistory * 0.05)
  
  return Math.min(1, score)
}

/**
 * Calculate content quality score
 * Based on: has images, caption length, engagement rate
 */
export function calculateQualityScore(
  hasImage: boolean,
  captionLength: number,
  engagementRate: number
): number {
  let score = 0
  
  // Has image (0-0.3)
  if (hasImage) score += 0.3
  
  // Caption quality (0-0.3)
  if (captionLength > 100) score += 0.3
  else if (captionLength > 50) score += 0.2
  else if (captionLength > 20) score += 0.1
  
  // Engagement rate bonus (0-0.4)
  score += Math.min(0.4, engagementRate * 0.1)
  
  return Math.min(1, score)
}

/**
 * Calculate overall post score
 * Weights:
 * - Engagement: 35%
 * - Recency: 30%
 * - Affinity: 25%
 * - Quality: 10%
 */
export function calculatePostScore(
  metrics: PostMetrics,
  viewerId: string,
  isFollowing: boolean,
  interactionHistory: number = 0
): number {
  const recencyScore = calculateRecencyScore(metrics.createdAt)
  const engagementScore = calculateEngagementScore(
    metrics.likesCount,
    metrics.commentsCount
  )
  const affinityScore = calculateAffinityScore(
    viewerId,
    metrics.authorId,
    isFollowing,
    interactionHistory
  )
  
  // Calculate engagement rate for quality score
  const engagementRate = metrics.likesCount + metrics.commentsCount
  const qualityScore = calculateQualityScore(
    metrics.hasImage,
    metrics.captionLength,
    engagementRate
  )
  
  // Weighted final score
  const finalScore = (
    engagementScore * 0.35 +
    recencyScore * 0.30 +
    affinityScore * 0.25 +
    qualityScore * 0.10
  )
  
  return finalScore
}

/**
 * Sort posts by ranking score
 */
export function rankPosts(
  posts: PostMetrics[],
  viewerId: string,
  followingIds: Set<string>,
  interactionHistory: Record<string, number> = {}
): RankedPost[] {
  const ranked = posts.map(post => {
    const isFollowing = followingIds.has(post.authorId)
    const history = interactionHistory[post.authorId] || 0
    
    return {
      postId: post.id,
      score: calculatePostScore(post, viewerId, isFollowing, history),
      engagementScore: calculateEngagementScore(post.likesCount, post.commentsCount),
      recencyScore: calculateRecencyScore(post.createdAt),
      affinityScore: calculateAffinityScore(viewerId, post.authorId, isFollowing, history),
      qualityScore: calculateQualityScore(
        post.hasImage,
        post.captionLength,
        post.likesCount + post.commentsCount
      ),
    }
  })
  
  // Sort by score descending
  return ranked.sort((a, b) => b.score - a.score)
}
