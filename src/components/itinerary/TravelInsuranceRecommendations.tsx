import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Plane, Heart, DollarSign, ExternalLink, Check, Star, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useFeatureToggle } from '@/hooks/useFeatureToggle'
import { Skeleton } from '@/components/ui/skeleton'

interface TravelInsuranceProps {
  country: string
  departureDate: string
  returnDate: string
  travelerAge?: number
}

interface InsurancePlan {
  id: string
  name: string
  provider: string
  price: number
  currency: string
  coverage: number
  features: string[]
  rating: number
  affiliateUrl: string
  recommended?: boolean
  sponsored?: boolean
}

export function TravelInsuranceRecommendations({ country, departureDate, returnDate, travelerAge = 30 }: TravelInsuranceProps) {
  const { enabled, loading } = useFeatureToggle('travel_insurance')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Feature is disabled - don't render anything
  if (!enabled && !loading) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-5 w-32 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  const plans: InsurancePlan[] = [
    {
      id: 'basic',
      name: 'Basic Coverage',
      provider: 'TravelSafe Insurance',
      price: 29.99,
      currency: 'USD',
      coverage: 50000,
      features: [
        'Emergency medical coverage',
        'Trip cancellation (up to $2,000)',
        'Lost luggage protection',
        '24/7 emergency assistance',
      ],
      rating: 4.2,
      affiliateUrl: `https://www.insurancepartner.com/quote?country=${country}&start=${departureDate}&end=${returnDate}&plan=basic&age=${travelerAge}&affiliate_id=travereel`,
    },
    {
      id: 'premium',
      name: 'Premium Protection',
      provider: 'GlobalTravel Insurance Co.',
      price: 59.99,
      currency: 'USD',
      coverage: 250000,
      features: [
        'Comprehensive medical coverage',
        'Trip cancellation & interruption (up to $10,000)',
        'Lost luggage & personal effects',
        'Flight delay compensation',
        'Emergency evacuation',
        'Adventure sports coverage',
        'Pre-existing conditions covered',
      ],
      rating: 4.8,
      affiliateUrl: `https://www.insurancepartner.com/quote?country=${country}&start=${departureDate}&end=${returnDate}&plan=premium&age=${travelerAge}&affiliate_id=travereel`,
      recommended: true,
    },
    {
      id: 'ultimate',
      name: 'Ultimate Peace of Mind',
      provider: 'SecureVoyage Insurance',
      price: 89.99,
      currency: 'USD',
      coverage: 500000,
      features: [
        'Unlimited medical coverage',
        'Cancel for any reason (CFAR)',
        'Full trip interruption coverage',
        'Premium luggage protection',
        'Flight delay & missed connection',
        'Emergency medical evacuation',
        'All adventure sports included',
        'Pre-existing & chronic conditions',
        'Personal liability coverage',
        'Rental car damage waiver',
      ],
      rating: 4.9,
      affiliateUrl: `https://www.insurancepartner.com/quote?country=${country}&start=${departureDate}&end=${returnDate}&plan=ultimate&age=${travelerAge}&affiliate_id=travereel`,
      sponsored: true,
    },
  ]

  const getQuoteUrl = () => {
    return `https://www.insurancepartner.com/compare?country=${encodeURIComponent(country)}&start=${departureDate}&end=${returnDate}&age=${travelerAge}&affiliate_id=travereel`
  }

  return (
    <div className="space-y-6">
      {/* Header with Trust Badge */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="size-5 text-green-600" />
          <h3 className="text-lg font-semibold">Protect Your Trip to {country}</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">
          Trusted Insurance Partners
        </Badge>
        <p className="text-sm text-muted-foreground">
          Comprehensive travel insurance starting from $29.99
        </p>
      </div>

      {/* Alert for International Travel */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-900">International Travel Recommended</AlertTitle>
        <AlertDescription className="text-blue-800">
          Travel insurance is highly recommended for trips to {country}. Medical emergencies abroad can cost thousands without coverage.
        </AlertDescription>
      </Alert>

      {/* Insurance Plans */}
      <Tabs defaultValue="premium" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="premium">Premium ⭐</TabsTrigger>
          <TabsTrigger value="ultimate">Ultimate</TabsTrigger>
        </TabsList>

        {plans.map((plan) => (
          <TabsContent key={plan.id} value={plan.id}>
            <Card className={`relative ${plan.recommended ? 'border-2 border-primary' : ''}`}>
              {plan.sponsored && (
                <Badge className="absolute -top-2 right-4 bg-amber-500 text-white">
                  Sponsored
                </Badge>
              )}
              {plan.recommended && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                  Recommended
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.provider}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{plan.rating}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-baseline gap-2">
                    <DollarSign className="size-5 text-primary" />
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Coverage up to ${plan.coverage.toLocaleString()}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">What's Included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setSelectedPlan(plan.id)
                    window.open(plan.affiliateUrl, '_blank')
                  }}
                >
                  Get Quote
                  <ExternalLink className="size-4 ml-2" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Prices may vary based on age and destination
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Compare All Plans */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Plane className="size-5 text-primary" />
              <h4 className="font-semibold">Not sure which plan is right for you?</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Compare all insurance plans side-by-side and find the perfect coverage for your trip to {country}.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open(getQuoteUrl(), '_blank')}
            >
              Compare All Plans
              <ExternalLink className="size-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="space-y-1">
          <Heart className="size-5 mx-auto text-red-500" />
          <p className="text-xs font-medium">Medical Coverage</p>
          <p className="text-[10px] text-muted-foreground">Up to $500K</p>
        </div>
        <div className="space-y-1">
          <Plane className="size-5 mx-auto text-blue-500" />
          <p className="text-xs font-medium">Trip Cancellation</p>
          <p className="text-[10px] text-muted-foreground">Full Refund</p>
        </div>
        <div className="space-y-1">
          <Shield className="size-5 mx-auto text-green-500" />
          <p className="text-xs font-medium">24/7 Support</p>
          <p className="text-[10px] text-muted-foreground">Global Assistance</p>
        </div>
      </div>
    </div>
  )
}
