// Script to create 3 dummy user accounts

async function createDummyAccounts() {
  const users = [
    {
      email: 'john.traveler@email.com',
      username: 'johntraveler',
      name: 'John Traveler',
      password: 'Travel123!@#'
    },
    {
      email: 'sarah.explorer@email.com',
      username: 'sara explorer',
      name: 'Sarah Explorer',
      password: 'Explore123!@#'
    },
    {
      email: 'mike.wanderer@email.com',
      username: 'mikewanderer',
      name: 'Mike Wanderer',
      password: 'Wander123!@#'
    }
  ]

  console.log('\n🧪 Creating 3 Dummy Accounts\n')
  console.log('=' .repeat(60))

  for (const user of users) {
    try {
      const response = await fetch('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: user.email,
          username: user.username,
          name: user.name,
          password: user.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log(`\n✅ Created: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Username: ${user.username}`)
        console.log(`   Password: ${user.password}`)
        console.log(`   Token: ${data.token.substring(0, 50)}...`)
      } else {
        console.log(`\n❌ Failed to create ${user.name}: ${data.error}`)
      }
    } catch (error) {
      console.log(`\n❌ Error creating ${user.name}: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Login at: http://localhost:3000')
  console.log('\n')
}

createDummyAccounts()
