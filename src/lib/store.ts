// Re-export everything from the new store directory for backward compatibility
export {
  useAppStore,
  defaultWizardData,
} from './store/index'

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
  AppStore,
} from './store/index'

// Re-export slice types for advanced usage
export type { AuthSlice } from './store/authSlice'
export type { NavSlice } from './store/navSlice'
export type { PostsSlice } from './store/postsSlice'
export type { StoriesSlice } from './store/storiesSlice'
export type { ItinerarySlice } from './store/itinerarySlice'
export type { CommunitySlice } from './store/communitySlice'
export type { SocialSlice } from './store/socialSlice'
export type { ChatSlice } from './store/chatSlice'
export type { NotificationSlice } from './store/notificationSlice'
export type { UISlice } from './store/uiSlice'
