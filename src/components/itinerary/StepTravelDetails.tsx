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
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#2F5C9B]/5 to-[#5CA5CD]/5 border border-[#2F5C9B]/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#2F5C9B]/10 flex items-center justify-center">
              <Plane className="size-4 text-[#2F5C9B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Flight Details</p>
              <p className="text-[10px] text-muted-foreground">Help us plan around your schedule</p>
            </div>
          </div>
          <Switch
            checked={hasFlightDetails}
            onCheckedChange={setHasFlightDetails}
            className="data-[state=checked]:bg-[#2F5C9B]"
          />
        </div>

        {hasFlightDetails && (
          <div className="space-y-4 pl-4 border-l-2 border-[#2F5C9B]/20 ml-4 animate-in slide-in-from-left-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="size-3.5 text-[#2F5C9B]" />
                  Departure Date
                </label>
                <Input
                  type="date"
                  value={wizardData.departureDate || ''}
                  onChange={(e) => setWizardData({ departureDate: e.target.value })}
                  className="h-11 rounded-lg border-2 border-gray-200 focus:border-[#2F5C9B] focus:ring-3 focus:ring-[#2F5C9B]/10 transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="size-3.5 text-[#5CA5CD]" />
                  Return Date
                </label>
                <Input
                  type="date"
                  value={wizardData.returnDate || ''}
                  onChange={(e) => setWizardData({ returnDate: e.target.value })}
                  className="h-11 rounded-lg border-2 border-gray-200 focus:border-[#5CA5CD] focus:ring-3 focus:ring-[#5CA5CD]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-[#2F5C9B]" />
                  Departure Time
                </label>
                <div className="relative group">
                  <Input
                    type="time"
                    value={wizardData.departureTime || ''}
                    onChange={(e) => setWizardData({ departureTime: e.target.value })}
                    className="h-11 rounded-lg border-2 border-gray-200 focus:border-[#2F5C9B] focus:ring-3 focus:ring-[#2F5C9B]/10 transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-[#5CA5CD]" />
                  Arrival Time
                </label>
                <div className="relative group">
                  <Input
                    type="time"
                    value={wizardData.arrivalTime || ''}
                    onChange={(e) => setWizardData({ arrivalTime: e.target.value })}
                    className="h-11 rounded-lg border-2 border-gray-200 focus:border-[#5CA5CD] focus:ring-3 focus:ring-[#5CA5CD]/10 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {wizardData.arrivalTime && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-[#5CA5CD]/5 border border-blue-200">
                <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">💡</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong className="font-semibold">Smart Planning:</strong> We'll optimize activities around your {wizardData.arrivalTime} arrival time
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hotel Details Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 border border-[#5CA5CD]/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#5CA5CD]/10 flex items-center justify-center">
              <Hotel className="size-4 text-[#5CA5CD]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Accommodation</p>
              <p className="text-[10px] text-muted-foreground">Do you have a hotel booked?</p>
            </div>
          </div>
          <Switch
            checked={hasHotel}
            onCheckedChange={setHasHotel}
            className="data-[state=checked]:bg-[#5CA5CD]"
          />
        </div>

        {!hasHotel && (
          <div className="pl-2 border-l-2 border-[#5CA5CD]/20 ml-4">
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
        <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-6 rounded-full bg-[#2F5C9B]/10 flex items-center justify-center">
              <span className="text-[#2F5C9B] text-xs font-bold">✓</span>
            </div>
            <p className="text-sm font-semibold text-foreground">Your Travel Details:</p>
          </div>
          {wizardData.departureTime && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/80 border border-gray-100">
              <div className="size-8 rounded-lg bg-[#2F5C9B]/10 flex items-center justify-center">
                <Plane className="size-4 text-[#2F5C9B]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Departure</p>
                <p className="text-xs font-semibold text-foreground">
                  {wizardData.departureDate || 'TBD'} at <span className="text-[#2F5C9B]">{wizardData.departureTime}</span>
                </p>
              </div>
            </div>
          )}
          {wizardData.arrivalTime && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/80 border border-gray-100">
              <div className="size-8 rounded-lg bg-[#5CA5CD]/10 flex items-center justify-center">
                <Plane className="size-4 text-[#5CA5CD]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Arrival</p>
                <p className="text-xs font-semibold text-foreground">
                  {wizardData.returnDate || 'TBD'} at <span className="text-[#5CA5CD]">{wizardData.arrivalTime}</span>
                </p>
              </div>
            </div>
          )}
          {!hasHotel && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/80 border border-gray-100">
              <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Hotel className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accommodation</p>
                <p className="text-xs font-semibold text-amber-700">Hotel recommendations will be included</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
