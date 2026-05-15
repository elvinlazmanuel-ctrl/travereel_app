import { z } from 'zod'

// Common schemas
export const userIdSchema = z.string().min(1, 'User ID is required')
export const postIdSchema = z.string().min(1, 'Post ID is required')
export const communityIdSchema = z.string().min(1, 'Community ID is required')

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Post schemas
export const createPostSchema = z.object({
  caption: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).min(0).optional(),
  isPublic: z.boolean().default(true),
  isMemory: z.boolean().default(false),
  location: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  authorId: userIdSchema,
  itineraryId: z.string().optional().nullable(),
})

export const updatePostSchema = z.object({
  id: z.string().optional(),
  postId: z.string().optional(),
  userId: userIdSchema.optional(),
  caption: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
  isFlagged: z.boolean().optional(),
  requestingUserId: userIdSchema.optional(),
})

export const deletePostSchema = z.object({
  postId: postIdSchema,
  userId: userIdSchema.optional(),
  requestingUserId: userIdSchema.optional(),
})

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  authorId: userIdSchema,
  postId: postIdSchema,
  parentId: z.string().optional(),
})

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  userId: userIdSchema,
})

// Like schema
export const toggleLikeSchema = z.object({
  userId: userIdSchema,
  postId: postIdSchema,
})

// Bookmark schema
export const toggleBookmarkSchema = z.object({
  userId: userIdSchema,
  postId: postIdSchema,
})

// Follow schema
export const followSchema = z.object({
  followerId: userIdSchema,
  followingId: userIdSchema,
})

// Friend request schemas
export const sendFriendRequestSchema = z.object({
  senderId: userIdSchema,
  receiverId: userIdSchema,
})

export const handleFriendRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  action: z.enum(['accept', 'reject']),
  userId: userIdSchema,
})

export const unfriendSchema = z.object({
  userId: userIdSchema,
  friendId: userIdSchema,
})

// Community schemas
export const createCommunitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  image: z.string().url().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  authorId: userIdSchema,
})

export const updateCommunitySchema = z.object({
  communityId: communityIdSchema.optional(),
  id: communityIdSchema.optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  category: z.string().max(50).optional(),
  members: z.number().int().min(0).optional(),
  joinCommunity: z.boolean().optional(),
  leaveCommunity: z.boolean().optional(),
  userId: userIdSchema.optional(),
  requestingUserId: userIdSchema.optional(),
  isFeatured: z.boolean().optional(),
})

export const deleteCommunitySchema = z.object({
  communityId: communityIdSchema,
  requestingUserId: userIdSchema,
})

// Itinerary schemas
export const createItinerarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  country: z.string().min(1, 'Country is required'),
  location: z.string().min(1, 'Location is required'),
  budget: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  days: z.number().int().min(1).max(365).optional(),
  travelType: z.string().default('solo'),
  activities: z.array(z.string()).default([]),
  status: z.enum(['pre-travel', 'during-travel', 'post-travel']).default('pre-travel'),
  isPublic: z.boolean().default(false),
  requirements: z.array(z.string()).default([]),
  authorId: userIdSchema,
  companions: z.array(z.object({ name: z.string(), email: z.string().email().optional(), userId: z.string().optional() })).optional(),
  daysPlan: z.array(z.any()).optional(),
  budgetItems: z.array(z.any()).optional(),
})

export const updateItinerarySchema = z.object({
  id: z.string().min(1, 'Itinerary ID is required'),
  status: z.enum(['pre-travel', 'during-travel', 'post-travel']).optional(),
  isPublic: z.boolean().optional(),
  activityUpdates: z.array(z.object({ activityId: z.string(), status: z.string() })).optional(),
})

// Chat schemas
export const createChatRoomSchema = z.object({
  name: z.string().max(100).optional(),
  memberIds: z.array(userIdSchema).min(2),
})

export const getOrCreateChatRoomSchema = z.object({
  userId1: userIdSchema,
  userId2: userIdSchema,
})

export const updateChatRoomSchema = z.object({
  chatRoomId: z.string().min(1, 'Chat room ID is required'),
  userId: userIdSchema,
})

// Message schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  senderId: userIdSchema,
  chatRoomId: z.string().min(1, 'Chat room ID is required'),
})

// Share schema
export const sharePostSchema = z.object({
  postId: postIdSchema,
  userId: userIdSchema,
  communityId: communityIdSchema,
  caption: z.string().max(500).optional(),
})

// Notification schema
export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1).optional(),
  userId: userIdSchema,
})

export const createNotificationSchema = z.object({
  userId: userIdSchema,
  type: z.string().min(1, 'Type is required'),
  message: z.string().min(1, 'Message is required'),
  fromUserId: z.string().optional(),
  postId: z.string().optional(),
})

// Story schemas
export const createStorySchema = z.object({
  mediaUrl: z.string().min(1, 'Media URL is required'),
  mediaType: z.enum(['image', 'video', 'text']).default('image'),
  caption: z.string().max(500).optional().nullable(),
  authorId: userIdSchema,
})

// Story view schema
export const createStoryViewSchema = z.object({
  userId: userIdSchema,
  storyId: z.string().min(1, 'Story ID is required'),
})

// Report schema
export const reportPostSchema = z.object({
  postId: postIdSchema,
  reporterId: userIdSchema,
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const updateReportSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  status: z.string().min(1, 'Status is required'),
})

// Settings schema
export const updateSettingsSchema = z.object({
  userId: userIdSchema,
  currency: z.string().max(10).optional(),
  travelType: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  notificationsEnabled: z.boolean().optional(),
  activityStatus: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  name: z.string().max(100).optional(),
  avatar: z.string().optional(),
})

// Budget item schema
export const createBudgetItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.string().min(1, 'Category is required').max(100),
  paidBy: z.string().min(1, 'Paid by is required'),
  splitAmong: z.array(z.string()).default([]),
  itineraryId: z.string().min(1, 'Itinerary ID is required'),
  userId: z.string().optional(),
})

// Admin action schema
export const adminActionSchema = z.object({
  adminId: userIdSchema,
  action: z.string().min(1, 'Action is required'),
  targetType: z.string().min(1, 'Target type is required'),
  targetId: z.string().min(1, 'Target ID is required'),
  details: z.string().optional(),
})

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues.map(e => e.message).join(', ')
  return { success: false, error: errorMessage }
}

// Helper for validating query params (all values are strings)
export function validateQuery<T>(schema: z.ZodSchema<T>, params: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(params)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues.map(e => e.message).join(', ')
  return { success: false, error: errorMessage }
}
