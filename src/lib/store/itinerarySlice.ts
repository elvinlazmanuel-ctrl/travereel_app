import type { StateCreator } from 'zustand'
import type { Itinerary, WizardData } from './types'
import { defaultWizardData } from './types'
import type { AppStore } from './index'

export interface ItinerarySlice {
  itineraries: Itinerary[]
  selectedItinerary: Itinerary | null
  wizardStep: number
  wizardData: WizardData
  isAIGenerate: boolean
  setItineraries: (itineraries: Itinerary[]) => void
  addItinerary: (itinerary: Itinerary) => void
  updateItinerary: (id: string, data: Partial<Itinerary>) => void
  setSelectedItinerary: (itinerary: Itinerary | null) => void
  setWizardStep: (step: number) => void
  setWizardData: (data: Partial<WizardData>) => void
  resetWizard: () => void
  setIsAIGenerate: (value: boolean) => void
}

export const createItinerarySlice: StateCreator<AppStore, [], [], ItinerarySlice> = (set) => ({
  itineraries: [],
  selectedItinerary: null,
  wizardStep: 0,
  wizardData: { ...defaultWizardData },
  isAIGenerate: false,

  setItineraries: (itineraries) => set({ itineraries }),
  addItinerary: (itinerary) => set((state) => ({ itineraries: [itinerary, ...state.itineraries] })),
  updateItinerary: (id, data) => set((state) => ({
    itineraries: state.itineraries.map(i => i.id === id ? { ...i, ...data } : i),
    selectedItinerary: state.selectedItinerary?.id === id
      ? { ...state.selectedItinerary, ...data }
      : state.selectedItinerary,
  })),
  setSelectedItinerary: (itinerary) => set({ selectedItinerary: itinerary }),
  setWizardStep: (step) => set({ wizardStep: step }),
  setWizardData: (data) => set((state) => ({ wizardData: { ...state.wizardData, ...data } })),
  resetWizard: () => set({ wizardStep: 0, wizardData: { ...defaultWizardData }, isAIGenerate: false }),
  setIsAIGenerate: (value) => set({ isAIGenerate: value }),
})
