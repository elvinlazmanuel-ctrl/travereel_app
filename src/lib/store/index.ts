import { create } from 'zustand'
import type { AuthSlice } from './authSlice'
import type { NavSlice } from './navSlice'
import type { PostsSlice } from './postsSlice'
import type { StoriesSlice } from './storiesSlice'
import type { ItinerarySlice } from './itinerarySlice'
import type { CommunitySlice } from './communitySlice'
import type { SocialSlice } from './socialSlice'
import type { ChatSlice } from './chatSlice'
import type { NotificationSlice } from './notificationSlice'
import type { UISlice } from './uiSlice'

import { createAuthSlice } from './authSlice'
import { createNavSlice } from './navSlice'
import { createPostsSlice } from './postsSlice'
import { createStoriesSlice } from './storiesSlice'
import { createItinerarySlice } from './itinerarySlice'
import { createCommunitySlice } from './communitySlice'
import { createSocialSlice } from './socialSlice'
import { createChatSlice } from './chatSlice'
import { createNotificationSlice } from './notificationSlice'
import { createUISlice } from './uiSlice'

// Re-export all types for backward compatibility
export type {
  ViewType,
  User,
  Post,
  Story,
  Itinerary,
  ItineraryDay,
  DayActivity,
  BudgetItem,
  Companion,
  CommunityType,
  CommentType,
  ChatRoomType,
  MessageType,
  NotificationType,
  FriendRequestType,
  SearchUserType,
  WizardData,
} from './types'

export { defaultWizardData } from './types'

export type AppStore = AuthSlice & NavSlice & PostsSlice & StoriesSlice & ItinerarySlice & CommunitySlice & SocialSlice & ChatSlice & NotificationSlice & UISlice

export const useAppStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createNavSlice(...a),
  ...createPostsSlice(...a),
  ...createStoriesSlice(...a),
  ...createItinerarySlice(...a),
  ...createCommunitySlice(...a),
  ...createSocialSlice(...a),
  ...createChatSlice(...a),
  ...createNotificationSlice(...a),
  ...createUISlice(...a),
}))
