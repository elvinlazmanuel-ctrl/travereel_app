'use client'

import { useState } from 'react'
import { Sparkles, Pencil, Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function StepModeSelection() {
  const { setIsAIGenerate, setWizardStep } = useAppStore()
  const [selectedMode, setSelectedMode] = useState<'ai' | 'manual' | null>(null)

  const handleContinue = () => {
    if (!selectedMode) return
    setIsAIGenerate(selectedMode === 'ai')
    setWizardStep(7)
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Choose how to create your itinerary
        </h2>
        <p className="text-sm text-gray-500">
          Let AI handle the planning or do it yourself
        </p>
      </div>

      {/* Mode Cards */}
      <div className="space-y-4">
        {/* AI Generate Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMode('ai')}
          className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all group ${
            selectedMode === 'ai'
              ? 'border-[#FF6B6B] bg-gradient-to-br from-[#FF6B6B]/10 via-[#FF8C42]/10 to-[#FFBA49]/10 shadow-md shadow-[#FF6B6B]/10'
              : 'border-[#FF6B6B]/30 bg-gradient-to-br from-[#FF6B6B]/5 via-[#FF8C42]/5 to-[#FFBA49]/5 hover:border-[#FF6B6B]/60'
          }`}
        >
          {selectedMode === 'ai' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 size-6 rounded-full bg-[#FF6B6B] flex items-center justify-center"
            >
              <Check className="size-4 text-white" strokeWidth={3} />
            </motion.div>
          )}
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] flex items-center justify-center shrink-0 shadow-lg shadow-[#FF6B6B]/20 group-hover:shadow-[#FF6B6B]/30 transition-shadow">
              <Sparkles className="size-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Let AI Plan Your Trip
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI will create a detailed day-by-day itinerary with routes, budget estimates, and requirements
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6B6B]/10 text-[10px] font-medium text-[#FF6B6B]">
                  ✨ Smart Routes
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF8C42]/10 text-[10px] font-medium text-[#FF8C42]">
                  💰 Budget Optimized
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFBA49]/10 text-[10px] font-medium text-[#FFBA49]">
                  ⚡ Instant
                </span>
              </div>
            </div>
          </div>
        </motion.button>

        {/* Manual Input Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMode('manual')}
          className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all group ${
            selectedMode === 'manual'
              ? 'border-[#2EC4B6] bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 shadow-md shadow-[#2EC4B6]/10'
              : 'border-[#2EC4B6]/30 bg-gradient-to-br from-[#2EC4B6]/5 to-[#FFBA49]/5 hover:border-[#2EC4B6]/60'
          }`}
        >
          {selectedMode === 'manual' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 size-6 rounded-full bg-[#2EC4B6] flex items-center justify-center"
            >
              <Check className="size-4 text-white" strokeWidth={3} />
            </motion.div>
          )}
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-[#2EC4B6] to-[#FFBA49] flex items-center justify-center shrink-0 shadow-lg shadow-[#2EC4B6]/20 group-hover:shadow-[#2EC4B6]/30 transition-shadow">
              <Pencil className="size-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Plan It Yourself
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Add your own activities, routes, and budget items manually
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[10px] font-medium text-[#2EC4B6]">
                  ✏️ Full Control
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFBA49]/10 text-[10px] font-medium text-[#FFBA49]">
                  🎯 Custom
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF8C42]/10 text-[10px] font-medium text-[#FF8C42]">
                  📋 Flexible
                </span>
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Continue Button */}
      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white font-semibold text-base shadow-lg shadow-[#FF6B6B]/20 hover:shadow-[#FF6B6B]/30"
          >
            Continue
          </Button>
        </motion.div>
      )}

      {/* Tips */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          💡 You can always edit your itinerary later, regardless of which mode you choose
        </p>
      </div>
    </div>
  )
}
