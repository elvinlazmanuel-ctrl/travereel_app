export type ViewType = 
  | 'auth' 
  | 'feed' 
  | 'discovery' 
  | 'create' 
  | 'community' 
  | 'profile' 
  | 'settings'
  | 'itinerary'
  | 'itinerary-detail'
  | 'during-travel'
  | 'post-travel'
  | 'story-viewer'
  | 'notifications'
  | 'create-post'
  | 'create-story'
  | 'budget-tracker'
  | 'community-detail'
  | 'messages'
  | 'chat-room'
  | 'user-profile'
  | 'friends'
  | 'admin'
  | 'admin-users'
  | 'admin-communities'
  | 'admin-posts'
  | 'admin-reports'

export interface User {
  id: string
  email: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
  isPrivate: boolean
  isBanned?: boolean
  role?: string
  currency?: string
  travelType?: string
  language?: string
  notificationsEnabled?: boolean
  activityStatus?: boolean
  darkMode?: boolean
  createdAt?: string
}

export interface Post {
  id: string
  caption: string | null
  images: string[]
  isPublic: boolean
  isMemory: boolean
  isFlagged?: boolean
  location: string | null
  latitude: number | null
  longitude: number | null
  tags: string[]
  authorId: string
  author: User
  createdAt: string
  likes: number
  comments: number
  isLiked: boolean
  isBookmarked?: boolean
  reportCount?: number
}

export interface Story {
  id: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  author: User
  authorId: string
  expiresAt: string
  createdAt: string
  viewed: boolean
}

export interface Itinerary {
  id: string
  title: string
  country: string
  location: string
  departureDate?: string | null
  returnDate?: string | null
  budget: number
  currency: string
  days: number
  travelType: string
  activities: string[]
  status: 'pre-travel' | 'during-travel' | 'post-travel'
  isPublic: boolean
  requirements: string[]
  collaborators?: string[] | null
  authorId: string
  createdAt: string
  daysPlan: ItineraryDay[]
  budgetItems: BudgetItem[]
  companions: Companion[]
}

export interface ItineraryDay {
  id: string
  dayNumber: number
  title: string
  description: string
  route: string | null
  status: 'pending' | 'completed' | 'skipped'
  activities: DayActivity[]
}

export interface DayActivity {
  id: string
  title: string
  description: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  startTime: string | null
  endTime: string | null
  cost: number
  status: 'pending' | 'completed' | 'skipped'
  order: number
}

export interface BudgetItem {
  id: string
  name: string
  amount: number
  category: string
  paidBy: string
  splitAmong: string[]
  itineraryId: string
}

export interface Companion {
  id: string
  name: string
  email: string | null
  userId: string | null
}

export interface CommunityType {
  id: string
  name: string
  description: string | null
  image: string | null
  members: number
  category: string | null
  isMember?: boolean
  communityMembers?: {
    id: string
    role: string
    joinedAt: string
    user: User
  }[]
}

export interface CommentType {
  id: string
  content: string
  authorId: string
  postId: string
  parentId: string | null
  likesCount: number
  createdAt: string
  author: User
  replies?: CommentType[]
}

export interface ChatRoomType {
  id: string
  name: string | null
  isGroup: boolean
  members: User[]
  lastMessage?: MessageType
  lastReadAt?: string
}

export interface MessageType {
  id: string
  content: string
  senderId: string
  chatRoomId: string
  createdAt: string
  sender: User
}

export interface NotificationType {
  id: string
  type: string
  message: string
  fromUserId: string | null
  postId: string | null
  read: boolean
  createdAt: string
  fromUser?: User
}

export interface FriendRequestType {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  sender?: User
  receiver?: User
  friend?: User
}

export interface SearchUserType extends User {
  friendRequestStatus?: 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' | null
  isFollowing?: boolean
}

export interface WizardData {
  title: string
  country: string
  location: string
  departureDate: string
  returnDate: string
  budget: number
  currency: string
  days: number
  travelType: string
  activities: string[]
  companions: Companion[]
}

export const defaultWizardData: WizardData = {
  title: '',
  country: '',
  location: '',
  departureDate: '',
  returnDate: '',
  budget: 0,
  currency: 'USD',
  days: 1,
  travelType: 'solo',
  activities: [],
  companions: [],
}
