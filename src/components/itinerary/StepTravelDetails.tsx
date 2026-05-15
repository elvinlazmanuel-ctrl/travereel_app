'use client'

import { useState } from 'react'
import { Plane, Hotel, Calendar, Clock, MapPin } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function StepTravelDetails() {
  const { wizardData, setWizardData } = useAppStore()
  const [hasFlightDetails, setHasFlightDetails] = useState(!!wizardData.departureTime)
  const [hasHotel, setHasHotel] = useState(wizardData.hasHotel !== false) // Default to true

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Travel Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Add your flight and accommodation details (optional)
        </p>
      </div>

      {/* Flight Details Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#FF6B6B]/5 to-[#FF8C42]/5 border border-[#FF6B6B]/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#FF6B6B]/10 flex items-center justify-center">
              <Plane className="size-4 text-[#FF6B6B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Flight Details</p>
              <p className="text-[10px] text-muted-foreground">Help us plan around your schedule</p>
            </div>
          </div>
          <Switch
            checked={hasFlightDetails}
            onCheckedChange={setHasFlightDetails}
            className="data-[state=checked]:bg-[#FF6B6B]"
          />
        </div>

        {hasFlightDetails && (
          <div className="space-y-3 pl-2 border-l-2 border-[#FF6B6B]/20 ml-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  <Calendar className="size-3 inline mr-1" />
                  Departure Date
                </label>
                <Input
                  type="date"
                  value={wizardData.departureDate || ''}
                  onChange={(e) => setWizardData({ departureDate: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  <Calendar className="size-3 inline mr-1" />
                  Return Date
                </label>
                <Input
                  type="date"
                  value={wizardData.returnDate || ''}
                  onChange={(e) => setWizardData({ returnDate: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  <Clock className="size-3 inline mr-1" />
                  Departure Time
                </label>
                <Input
                  type="time"
                  value={wizardData.departureTime || ''}
                  onChange={(e) => setWizardData({ departureTime: e.target.value })}
                  placeholder="08:30"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  <Clock className="size-3 inline mr-1" />
                  Arrival Time
                </label>
                <Input
                  type="time"
                  value={wizardData.arrivalTime || ''}
                  onChange={(e) => setWizardData({ arrivalTime: e.target.value })}
                  placeholder="14:30"
                  className="text-sm"
                />
              </div>
            </div>

            {wizardData.arrivalTime && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> We'll plan activities around your {wizardData.arrivalTime} arrival time
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hotel Details Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#2EC4B6]/5 to-[#FFBA49]/5 border border-[#2EC4B6]/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#2EC4B6]/10 flex items-center justify-center">
              <Hotel className="size-4 text-[#2EC4B6]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Accommodation</p>
              <p className="text-[10px] text-muted-foreground">Do you have a hotel booked?</p>
            </div>
          </div>
          <Switch
            checked={hasHotel}
            onCheckedChange={setHasHotel}
            className="data-[state=checked]:bg-[#2EC4B6]"
          />
        </div>

        {!hasHotel && (
          <div className="pl-2 border-l-2 border-[#2EC4B6]/20 ml-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Need Hotel Recommendations?</p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Our AI will suggest the best areas to stay in {wizardData.location || 'your destination'}.
                    You can browse and book hotels later through our partners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(wizardData.departureTime || wizardData.arrivalTime || !hasHotel) && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-foreground mb-2">Your Travel Details:</p>
          {wizardData.departureTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Plane className="size-3 text-[#FF6B6B]" />
              <span>Departure: {wizardData.departureDate || 'TBD'} at {wizardData.departureTime}</span>
            </div>
          )}
          {wizardData.arrivalTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Plane className="size-3 text-[#2EC4B6]" />
              <span>Arrival: {wizardData.returnDate || 'TBD'} at {wizardData.arrivalTime}</span>
            </div>
          )}
          {!hasHotel && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Hotel className="size-3 text-amber-600" />
              <span>Hotel recommendations will be included</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
