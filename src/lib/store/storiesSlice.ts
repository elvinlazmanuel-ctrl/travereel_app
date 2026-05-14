import type { StateCreator } from 'zustand'
import type { Story } from './types'
import type { AppStore } from './index'

export interface StoriesSlice {
  stories: Story[]
  selectedStoryIndex: number
  setStories: (stories: Story[]) => void
  addStory: (story: Story) => void
  setSelectedStoryIndex: (index: number) => void
  markStoryViewed: (storyId: string) => void
}

export const createStoriesSlice: StateCreator<AppStore, [], [], StoriesSlice> = (set) => ({
  stories: [],
  selectedStoryIndex: 0,

  setStories: (stories) => set({ stories }),
  addStory: (story) => set((state) => ({ stories: [story, ...state.stories] })),
  setSelectedStoryIndex: (index) => set({ selectedStoryIndex: index }),
  markStoryViewed: (storyId) => set((state) => ({
    stories: state.stories.map(s =>
      s.id === storyId ? { ...s, viewed: true } : s
    ),
  })),
})
