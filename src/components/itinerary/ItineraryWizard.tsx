'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StepCountry from './StepCountry'
import StepLocation from './StepLocation'
import StepTravelDates from './StepTravelDates'
import StepBudget from './StepBudget'
import StepTravelDetails from './StepTravelDetails'
import StepDays from './StepDays'
import StepTravelType from './StepTravelType'
import StepActivities from './StepActivities'
import StepModeSelection from './StepModeSelection'
import AIGenerateResult from './AIGenerateResult'
import ManualInputForm from './ManualInputForm'

const stepLabels = [
  'Country',
  'Location',
  'Dates',
  'Budget',
  'Details',
  'Days',
  'Type',
  'Activities',
  'Mode',
  'Result',
]

export default function ItineraryWizard() {
  const {
    wizardStep,
    setWizardStep,
    wizardData,
    isAIGenerate,
    resetWizard,
    setCurrentView,
  } = useAppStore()

  const totalSteps = 10 // 0-9

  // Determine which content to show
  const getStepContent = () => {
    // After mode selection, show result forms
    if (wizardStep === 9) {
      return isAIGenerate ? <AIGenerateResult /> : <ManualInputForm />
    }
    switch (wizardStep) {
      case 0: return <StepCountry />
      case 1: return <StepLocation />
      case 2: return <StepTravelDates />
      case 3: return <StepBudget />
      case 4: return <StepTravelDetails />
      case 5: return <StepDays />
      case 6: return <StepTravelType />
      case 7: return <StepActivities />
      case 8: return <StepModeSelection />
      default: return <StepCountry />
    }
  }

  const canGoNext = (): boolean => {
    if (wizardStep >= 9) return false
    switch (wizardStep) {
      case 0: return !!(wizardData.title.trim() && wizardData.country)
      case 1: {
        // Check if at least one location is selected
        const locations = Array.isArray(wizardData.location) 
          ? wizardData.location 
          : wizardData.location ? [wizardData.location] : []
        return locations.length > 0
      }
      case 2: return !!(wizardData.departureDate && wizardData.returnDate)
      case 3: return wizardData.budget > 0
      case 4: return true // Travel details are optional
      case 5: return wizardData.days > 0
      case 6:
        if (wizardData.travelType === 'solo') return true
        return wizardData.companions.length > 0
      case 7: return wizardData.activities.length > 0
      case 8: return true // Mode selection handles its own navigation
      case 9: return false // Result step, no next
      default: return true
    }
  }

  const canGoBack = (): boolean => {
    return wizardStep > 0 && wizardStep < 9
  }

  const handleNext = () => {
    if (wizardStep < totalSteps - 1 && wizardStep < 8) {
      setWizardStep(wizardStep + 1)
    }
  }

  const handleBack = () => {
    if (wizardStep > 0 && wizardStep < 9) {
      setWizardStep(wizardStep - 1)
    }
  }

  const handleCancel = () => {
    resetWizard()
    setCurrentView('feed')
  }

  const slideDirection = 1 // Forward

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      {wizardStep < 9 && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-4">
            {/* Navigation row */}
            <div className="flex items-center justify-between h-12">
              {canGoBack() ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="size-9"
                  aria-label="Go back"
                >
                  <ArrowLeft className="size-5 text-foreground" />
                </Button>
              ) : (
                <div className="size-9" />
              )}

              <h2 className="text-sm font-semibold text-foreground">
                Create Itinerary
              </h2>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="size-9"
                aria-label="Cancel"
              >
                <X className="size-5 text-gray-400" />
              </Button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 pb-3">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{
                        width: i < wizardStep ? '100%' : i === wizardStep ? '50%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: i <= wizardStep
                          ? 'linear-gradient(90deg, #2F5C9B, #5CA5CD)'
                          : 'transparent',
                      }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-medium ${
                      i <= wizardStep ? 'text-[#5CA5CD]' : 'text-gray-300'
                    }`}
                  >
                    {stepLabels[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizardStep}
            initial={{ x: slideDirection * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -slideDirection * 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {getStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {wizardStep < 9 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-md mx-auto flex gap-3">
            {canGoBack() && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 border-gray-200"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex-1 h-12 bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white font-semibold disabled:opacity-50"
            >
              {wizardStep === 7 ? 'Continue' : 'Next'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
