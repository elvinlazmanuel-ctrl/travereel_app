/**
 * Password Migration Script
 * 
 * This script hashes all plain-text passwords in the database.
 * Run this ONCE after deploying the new security system.
 * 
 * Usage:
 *   npx tsx scripts/migrate-passwords.ts
 */

import { db } from '../src/lib/db'
import { hashPassword, comparePassword } from '../src/lib/auth-utils'

async function migratePasswords() {
  console.log('🔐 Starting password migration...\n')

  try {
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    console.log(`Found ${users.length} users to check\n`)

    let hashed = 0
    let alreadyHashed = 0
    let errors = 0

    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (user.password.startsWith('$2')) {
          console.log(`✓ ${user.email} - Already hashed`)
          alreadyHashed++
          continue
        }

        // Hash the plain-text password
        const hashedPassword = await hashPassword(user.password)

        // Update the user record
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })

        console.log(`✓ ${user.email} - Password hashed successfully`)
        hashed++

        // Verify the hash works
        const isValid = await comparePassword(user.password, hashedPassword)
        if (!isValid) {
          console.error(`⚠️  WARNING: Hash verification failed for ${user.email}`)
          errors++
        }
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error)
        errors++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Total users: ${users.length}`)
    console.log(`   Passwords hashed: ${hashed}`)
    console.log(`   Already hashed: ${alreadyHashed}`)
    console.log(`   Errors: ${errors}`)

    if (errors > 0) {
      console.log('\n⚠️  Please review the errors above')
    } else {
      console.log('\n✅ Migration completed successfully!')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migratePasswords()
