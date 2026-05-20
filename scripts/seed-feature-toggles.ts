/**
 * Seed script for feature toggles
 * Run with: npx tsx scripts/seed-feature-toggles.ts
 */

import { db } from '../src/lib/db'

const featureToggles = [
  {
    key: 'where_to_stay',
    label: 'Where to Stay',
    description: 'Hotel booking widget and accommodation recommendations powered by Booking.com',
    category: 'monetization',
    enabled: true,
    apiConfig: JSON.stringify({
      provider: 'booking.com',
      affiliateId: 'your-affiliate-id',
      apiKey: null, // To be configured by superadmin
      endpoint: 'https://api.booking.com',
    }),
    metadata: JSON.stringify({
      commission: '8%',
      displayPosition: 'itinerary-detail',
      maxHotels: 5,
    }),
  },
  {
    key: 'travel_insurance',
    label: 'Travel Insurance',
    description: 'Travel insurance recommendations with affiliate links to insurance providers',
    category: 'monetization',
    enabled: true,
    apiConfig: JSON.stringify({
      providers: ['SafetyWing', 'WorldNomads', 'Allianz'],
      affiliateLinks: {
        safetyWing: 'https://safetywing.com?ref=travereel',
        worldNomads: 'https://worldnomads.com?ref=travereel',
        allianz: 'https://allianz.com?ref=travereel',
      },
    }),
    metadata: JSON.stringify({
      commission: '10-15%',
      displayPosition: 'itinerary-detail',
      defaultProvider: 'SafetyWing',
    }),
  },
  {
    key: 'ai_itinerary_generator',
    label: 'AI Itinerary Generator',
    description: 'AI-powered itinerary generation using OpenAI GPT-4',
    category: 'features',
    enabled: true,
    apiConfig: JSON.stringify({
      provider: 'openai',
      model: 'gpt-4-turbo',
      maxTokens: 4000,
      temperature: 0.7,
    }),
    metadata: JSON.stringify({
      costPerRequest: '~$0.02',
      rateLimit: '100 requests/hour',
    }),
  },
  {
    key: 'weather_forecast',
    label: 'Weather Forecast',
    description: '7-day weather forecast using OpenWeatherMap API',
    category: 'features',
    enabled: true,
    apiConfig: JSON.stringify({
      provider: 'openweathermap',
      endpoint: 'https://api.openweathermap.org/data/2.5',
    }),
    metadata: JSON.stringify({
      freeTierLimit: '1000 calls/day',
      updateInterval: '6 hours',
    }),
  },
  {
    key: 'currency_converter',
    label: 'Currency Converter',
    description: 'Real-time currency conversion using ExchangeRate API',
    category: 'features',
    enabled: true,
    apiConfig: JSON.stringify({
      provider: 'exchangerate-api',
      endpoint: 'https://v6.exchangerate-api.com/v6',
    }),
    metadata: JSON.stringify({
      freeTierLimit: '1500 calls/month',
      cacheDuration: '24 hours',
    }),
  },
  {
    key: 'premium_subscriptions',
    label: 'Premium Subscriptions',
    description: 'Stripe-powered subscription system for Pro and Elite tiers',
    category: 'monetization',
    enabled: false,
    apiConfig: JSON.stringify({
      provider: 'stripe',
      publishableKey: null, // To be configured
      secretKey: null, // To be configured
      webhookSecret: null, // To be configured
    }),
    metadata: JSON.stringify({
      plans: {
        pro: { price: 499, interval: 'monthly' },
        elite: { price: 999, interval: 'monthly' },
      },
    }),
  },
  {
    key: 'push_notifications',
    label: 'Push Notifications',
    description: 'Web push notifications using VAPID protocol',
    category: 'features',
    enabled: true,
    apiConfig: JSON.stringify({
      vapidPublicKey: null, // To be configured
      vapidPrivateKey: null, // To be configured
    }),
    metadata: JSON.stringify({
      maxNotificationsPerDay: 5,
      ttl: 86400, // 24 hours
    }),
  },
]

async function main() {
  console.log('🌱 Seeding feature toggles...')

  let created = 0
  let updated = 0

  for (const feature of featureToggles) {
    const existing = await db.featureToggle.findUnique({
      where: { key: feature.key },
    })

    if (existing) {
      // Update existing feature
      await db.featureToggle.update({
        where: { key: feature.key },
        data: {
          label: feature.label,
          description: feature.description,
          category: feature.category,
          apiConfig: feature.apiConfig,
          metadata: feature.metadata,
        },
      })
      updated++
      console.log(`✓ Updated: ${feature.label}`)
    } else {
      // Create new feature
      await db.featureToggle.create({
        data: feature,
      })
      created++
      console.log(`✓ Created: ${feature.label}`)
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Created: ${created} features`)
  console.log(`   Updated: ${updated} features`)
  console.log(`   Total: ${featureToggles.length} features`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding feature toggles:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
