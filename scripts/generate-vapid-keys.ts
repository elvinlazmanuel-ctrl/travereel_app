import webpush from 'web-push'

// Generate VAPID keys for push notifications
const vapidKeys = webpush.generateVAPIDKeys()

console.log('========================================')
console.log('VAPID Keys for Push Notifications')
console.log('========================================')
console.log('')
console.log('Add these to your .env file:')
console.log('')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log('')
console.log('========================================')
console.log('IMPORTANT: Keep your private key secret!')
console.log('========================================')
