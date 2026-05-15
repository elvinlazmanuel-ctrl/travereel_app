import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Headphones, Languages, Download, Check, Sparkles, Star, Crown, ExternalLink, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface PremiumAddonsProps {
  location: string
  country: string
  language: string
  days: number
}

interface AddonItem {
  id: string
  type: 'map' | 'audio' | 'language'
  title: string
  description: string
  price: number
  currency: string
  icon: any
  features: string[]
  rating: number
  reviews: number
  fileSize?: string
  duration?: string
  premium?: boolean
}

export function PremiumAddons({ location, country, language, days }: PremiumAddonsProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('maps')

  const addons: AddonItem[] = [
    // Offline Maps
    {
      id: 'map-offline',
      type: 'map',
      title: `Offline Map: ${location}`,
      description: 'Download detailed offline map with GPS navigation, points of interest, and walking routes.',
      price: 4.99,
      currency: 'USD',
      icon: Map,
      features: [
        'Full GPS navigation without internet',
        'Points of interest (restaurants, attractions, hotels)',
        'Walking & driving routes',
        'Emergency locations (hospitals, police, embassies)',
        'Works for entire trip duration',
        'Auto-updates when connected',
      ],
      rating: 4.7,
      reviews: 12847,
      fileSize: '245 MB',
    },
    {
      id: 'map-premium',
      type: 'map',
      title: `Premium Map Bundle: ${country}`,
      description: 'Complete country-wide offline map with premium features and insider tips.',
      price: 9.99,
      currency: 'USD',
      icon: Map,
      features: [
        'Everything in Offline Map',
        'Entire country coverage',
        'Local insider recommendations',
        'Hidden gems & secret spots',
        'Public transit routes & schedules',
        '3D building views in cities',
        'Lifetime updates included',
      ],
      rating: 4.9,
      reviews: 8234,
      fileSize: '1.2 GB',
      premium: true,
    },

    // Audio Guides
    {
      id: 'audio-city',
      type: 'audio',
      title: `${location} Audio Guide`,
      description: 'Professional audio walking tours with historical insights and local stories.',
      price: 7.99,
      currency: 'USD',
      icon: Headphones,
      features: [
        '5+ hours of professional narration',
        '10+ guided walking tours',
        'Historical & cultural insights',
        'Local stories & legends',
        'Self-paced exploration',
        'Works offline after download',
      ],
      rating: 4.8,
      reviews: 5621,
      duration: '5-6 hours',
    },
    {
      id: 'audio-premium',
      type: 'audio',
      title: 'Premium Audio Experience',
      description: 'Immersive 3D audio tours with expert historians and local guides.',
      price: 14.99,
      currency: 'USD',
      icon: Headphones,
      features: [
        'Everything in Audio Guide',
        '3D spatial audio experience',
        'Expert historian narration',
        'Exclusive local interviews',
        'AR overlay at landmarks (phone required)',
        'Customizable tour routes',
        'Bonus food & market tours',
      ],
      rating: 4.9,
      reviews: 3102,
      duration: '10-12 hours',
      premium: true,
    },

    // Language Packs
    {
      id: 'language-basic',
      type: 'language',
      title: `Basic ${language} Phrasebook`,
      description: 'Essential phrases for travelers with audio pronunciation guide.',
      price: 2.99,
      currency: 'USD',
      icon: Languages,
      features: [
        '100+ essential phrases',
        'Audio pronunciation by natives',
        'Categories: greetings, food, transport, emergency',
        'Quick-access flashcards',
        'Offline dictionary',
        'Cultural tips & etiquette',
      ],
      rating: 4.5,
      reviews: 9834,
      fileSize: '85 MB',
    },
    {
      id: 'language-conversation',
      type: 'language',
      title: `Complete ${language} Course`,
      description: 'Comprehensive language pack with AI conversation practice.',
      price: 12.99,
      currency: 'USD',
      icon: Languages,
      features: [
        'Everything in Basic Phrasebook',
        '500+ phrases & vocabulary',
        'AI conversation practice',
        'Real-time translation camera',
        'Menu & sign translator',
        'Grammar quick reference',
        'Regional dialect support',
        'Progress tracking',
      ],
      rating: 4.8,
      reviews: 6421,
      fileSize: '320 MB',
      premium: true,
    },
  ]

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const totalPrice = addons
    .filter(a => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0)

  const filteredAddons = addons.filter(a => a.type === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="size-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Enhance Your Trip</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
          Premium Add-ons
        </Badge>
        <p className="text-sm text-muted-foreground">
          Unlock exclusive features for your trip to {location}
        </p>
      </div>

      {/* Bundle Discount Alert */}
      {selectedAddons.length >= 2 && (
        <Alert className="border-green-200 bg-green-50">
          <Sparkles className="size-4 text-green-600" />
          <AlertTitle className="text-green-900">Bundle Discount Applied!</AlertTitle>
          <AlertDescription className="text-green-800">
            You're saving 10% on your add-on bundle. Total: ${((totalPrice * 0.9).toFixed(2))} {addons[0].currency}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="maps">
            <Map className="size-4 mr-1" />
            Maps
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Headphones className="size-4 mr-1" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="language">
            <Languages className="size-4 mr-1" />
            Language
          </TabsTrigger>
        </TabsList>

        {/* Addon List */}
        <div className="space-y-4 mt-4">
          <AnimatePresence mode="wait">
            {filteredAddons.map((addon) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedAddons.includes(addon.id)
                      ? 'border-2 border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${addon.premium ? 'bg-amber-100' : 'bg-gray-100'}`}>
                          <addon.icon className={`size-5 ${addon.premium ? 'text-amber-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{addon.title}</CardTitle>
                            {addon.premium && (
                              <Badge className="bg-amber-500 text-white text-[10px]">
                                <Star className="size-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{addon.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold">${addon.price}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                            {addon.rating} ({addon.reviews.toLocaleString()})
                          </div>
                        </div>
                        <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAddons.includes(addon.id)
                            ? 'bg-primary border-primary'
                            : 'border-gray-300'
                        }`}>
                          {selectedAddons.includes(addon.id) && (
                            <Check className="size-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">What's Included:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {addon.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                      {addon.features.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{addon.features.length - 4} more features
                        </p>
                      )}
                      {(addon.fileSize || addon.duration) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Download className="size-3" />
                          {addon.fileSize && <span>Size: {addon.fileSize}</span>}
                          {addon.duration && <span>Duration: {addon.duration}</span>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Tabs>

      {/* Purchase Button */}
      {selectedAddons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky bottom-4 z-10"
        >
          <Card className="border-primary shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected</p>
                  {selectedAddons.length >= 2 && (
                    <p className="text-xs text-green-600">Bundle discount: 10% off</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${selectedAddons.length >= 2 ? (totalPrice * 0.9).toFixed(2) : totalPrice.toFixed(2)}
                  </p>
                  <Button
                    size="lg"
                    className="mt-1"
                    onClick={() => {
                      // In production, this would open checkout
                      alert(`Checkout: ${selectedAddons.length} add-ons\nTotal: $${totalPrice.toFixed(2)}`)
                    }}
                  >
                    Purchase Add-ons
                    <ExternalLink className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Free Alternatives Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Free Alternatives Available</AlertTitle>
        <AlertDescription className="text-blue-800">
          These premium add-ons enhance your experience, but free alternatives exist:
          Google Maps (online), free walking tours, and basic phrase apps. Premium features work fully offline!
        </AlertDescription>
      </Alert>
    </div>
  )
}
