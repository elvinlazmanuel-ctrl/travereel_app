'use client'

import { Image, Camera, MapPin, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'

const createOptions = [
  {
    icon: Image,
    label: 'New Post',
    description: 'Share your travel moments',
    view: 'create-post' as const,
    gradient: 'from-[#FF6B6B] to-[#FF8C42]',
  },
  {
    icon: Camera,
    label: 'New Story',
    description: 'Quick moments that disappear',
    view: 'create-story' as const,
    gradient: 'from-[#FF8C42] to-[#FFBA49]',
  },
  {
    icon: MapPin,
    label: 'New Itinerary',
    description: 'Plan your next adventure',
    view: 'itinerary' as const,
    gradient: 'from-[#2EC4B6] to-[#FFBA49]',
  },
]

export default function CreateMenu() {
  const { showCreateMenu, setShowCreateMenu, setCurrentView } = useAppStore()

  const handleSelect = (view: 'create-post' | 'create-story' | 'itinerary') => {
    setShowCreateMenu(false)
    setCurrentView(view)
  }

  const handleClose = () => {
    setShowCreateMenu(false)
  }

  return (
    <AnimatePresence>
      {showCreateMenu && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pb-8 space-y-3">
              {createOptions.map((option) => {
                const Icon = option.icon
                return (
                  <motion.button
                    key={option.label}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(option.view)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${option.gradient} shadow-md`}
                    >
                      <Icon className="size-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {option.description}
                      </p>
                    </div>
                    <svg
                      className="size-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
