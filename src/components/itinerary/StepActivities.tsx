'use client'

import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

const activityCategories = [
  { id: 'cultural', label: 'Cultural & Historical', emoji: '🏛️' },
  { id: 'beach', label: 'Beach & Relaxation', emoji: '🏖️' },
  { id: 'hiking', label: 'Hiking & Nature', emoji: '🥾' },
  { id: 'food', label: 'Food & Dining', emoji: '🍜' },
  { id: 'adventure', label: 'Adventure Sports', emoji: '🎿' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nightlife', label: 'Entertainment & Nightlife', emoji: '🎭' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
  { id: 'wellness', label: 'Wellness & Spa', emoji: '🧘' },
  { id: 'water', label: 'Water Activities', emoji: '🎣' },
  { id: 'mountain', label: 'Mountain Activities', emoji: '🏔️' },
  { id: 'art', label: 'Art & Museums', emoji: '🎨' },
]

export default function StepActivities() {
  const { wizardData, setWizardData } = useAppStore()
  const selectedActivities = wizardData.activities

  const toggleActivity = (activityId: string) => {
    if (selectedActivities.includes(activityId)) {
      setWizardData({ activities: selectedActivities.filter((a) => a !== activityId) })
    } else {
      setWizardData({ activities: [...selectedActivities, activityId] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          What activities are you interested in?
        </h2>
        <p className="text-sm text-gray-500">
          Select at least 1 activity to personalize your itinerary
        </p>
      </div>

      {/* Selected Count */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FF6B6B, #FF8C42, #FFBA49)',
            }}
            animate={{
              width: `${Math.min((selectedActivities.length / activityCategories.length) * 100, 100)}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 shrink-0">
          {selectedActivities.length}/{activityCategories.length}
        </span>
      </div>

      {/* Activity Chips */}
      <div className="flex flex-wrap gap-2">
        {activityCategories.map((activity) => {
          const isSelected = selectedActivities.includes(activity.id)
          return (
            <motion.button
              key={activity.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleActivity(activity.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${
                isSelected
                  ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span className="text-lg">{activity.emoji}</span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-[#FF6B6B]' : 'text-gray-700'
                }`}
              >
                {activity.label}
              </span>
              {isSelected && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="size-4 text-[#FF6B6B]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Summary */}
      {selectedActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-[#FF6B6B]/5 via-[#FF8C42]/5 to-[#FFBA49]/5 border border-[#FF6B6B]/20"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Selected Activities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedActivities.map((id) => {
              const activity = activityCategories.find((a) => a.id === id)
              return activity ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/80 text-xs font-medium text-gray-700"
                >
                  {activity.emoji} {activity.label}
                </span>
              ) : null
            })}
          </div>
        </motion.div>
      )}

      {selectedActivities.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-amber-600">
            Please select at least one activity
          </p>
        </div>
      )}
    </div>
  )
}
