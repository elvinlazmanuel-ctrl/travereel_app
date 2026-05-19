import webpush from 'web-push'

// VAPID keys for push notification authentication
// Generate these once and store in environment variables
// Run: npx ts-node scripts/generate-vapid-keys.ts

export function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID keys not found in environment variables. Run: npx ts-node scripts/generate-vapid-keys.ts'
    )
  }

  return {
    publicKey,
    privateKey,
  }
}

export function initializeWebPush() {
  const { publicKey, privateKey } = getVapidKeys()

  webpush.setVapidDetails(
    'mailto:admin@travereel.com',
    publicKey,
    privateKey
  )

  return webpush
}

export { webpush }
