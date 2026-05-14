import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Seed route - populates database with demo data
export async function POST(request: Request) {
  try {
    // Clean up existing data in reverse dependency order
    try { await db.adminAction.deleteMany() } catch {}
    try { await db.featureToggle.deleteMany() } catch {}
    try { await db.platformSettings.deleteMany() } catch {}
    try { await db.postReport.deleteMany() } catch {}
    try { await db.storyView.deleteMany() } catch {}
    try { await db.sharedPost.deleteMany() } catch {}
    try { await db.notification.deleteMany() } catch {}
    try { await db.communityMember.deleteMany() } catch {}
    try { await db.chatRoomMember.deleteMany() } catch {}
    try { await db.chatRoom.deleteMany() } catch {}
    await db.dayActivity.deleteMany()
    await db.budgetItem.deleteMany()
    await db.companion.deleteMany()
    await db.itineraryDay.deleteMany()
    await db.bookmark.deleteMany()
    await db.like.deleteMany()
    await db.comment.deleteMany()
    await db.post.deleteMany()
    await db.story.deleteMany()
    await db.itinerary.deleteMany()
    await db.message.deleteMany()
    await db.follow.deleteMany()
    await db.community.deleteMany()
    await db.user.deleteMany()

    // Create demo users (user1 is admin) with new fields
    const user1 = await db.user.create({
      data: {
        email: 'alex@travel.com',
        username: 'alextraveler',
        name: 'Alex Chen',
        password: 'demo123',
        avatar: 'https://picsum.photos/seed/alex/200/200',
        bio: '🌍 Full-time traveler | 30+ countries | Living out of a backpack',
        role: 'admin',
        currency: 'USD',
        travelType: 'solo',
        language: 'en',
        notificationsEnabled: true,
        activityStatus: true,
        darkMode: false,
        isPrivate: false,
      },
    })

    const user2 = await db.user.create({
      data: {
        email: 'sarah@travel.com',
        username: 'sarahwanderlust',
        name: 'Sarah Kim',
        password: 'demo123',
        avatar: 'https://picsum.photos/seed/sarah/200/200',
        bio: '✈️ Travel blogger | Foodie | Sunset chaser',
        currency: 'EUR',
        travelType: 'couple',
        language: 'en',
        notificationsEnabled: true,
        activityStatus: true,
        darkMode: true,
        isPrivate: false,
      },
    })

    const user3 = await db.user.create({
      data: {
        email: 'mike@travel.com',
        username: 'mikeexplorer',
        name: 'Mike Johnson',
        password: 'demo123',
        avatar: 'https://picsum.photos/seed/mike/200/200',
        bio: '🏔️ Adventure seeker | Mountain lover | Photography',
        currency: 'GBP',
        travelType: 'solo',
        language: 'en',
        notificationsEnabled: true,
        activityStatus: false,
        darkMode: false,
        isPrivate: false,
      },
    })

    const user4 = await db.user.create({
      data: {
        email: 'emma@travel.com',
        username: 'emmajourney',
        name: 'Emma Wilson',
        password: 'demo123',
        avatar: 'https://picsum.photos/seed/emma/200/200',
        bio: '🎨 Art & culture explorer | City wanderer | Coffee addict',
        currency: 'JPY',
        travelType: 'group',
        language: 'ja',
        notificationsEnabled: false,
        activityStatus: true,
        darkMode: false,
        isPrivate: true,
      },
    })

    // Create follows
    await db.follow.createMany({
      data: [
        { followerId: user1.id, followingId: user2.id },
        { followerId: user1.id, followingId: user3.id },
        { followerId: user2.id, followingId: user1.id },
        { followerId: user2.id, followingId: user4.id },
        { followerId: user3.id, followingId: user1.id },
        { followerId: user3.id, followingId: user2.id },
        { followerId: user4.id, followingId: user1.id },
        { followerId: user4.id, followingId: user3.id },
      ],
    })

    // Create posts
    const post1 = await db.post.create({
      data: {
        caption: 'Golden hour in Santorini 🌅 The views here are absolutely breathtaking!',
        images: JSON.stringify([
          'https://picsum.photos/seed/santorini1/800/600',
          'https://picsum.photos/seed/santorini2/800/600',
        ]),
        isPublic: true,
        location: 'Santorini, Greece',
        tags: JSON.stringify(['santorini', 'greece', 'sunset', 'travel']),
        authorId: user1.id,
      },
    })

    const post2 = await db.post.create({
      data: {
        caption: 'Lost in the streets of Tokyo 🏯 Every corner has a story to tell.',
        images: JSON.stringify([
          'https://picsum.photos/seed/tokyo1/800/600',
        ]),
        isPublic: true,
        location: 'Tokyo, Japan',
        tags: JSON.stringify(['tokyo', 'japan', 'streetphotography', 'culture']),
        authorId: user2.id,
      },
    })

    const post3 = await db.post.create({
      data: {
        caption: 'Summit reached! 🏔️ The Dolomites never disappoint.',
        images: JSON.stringify([
          'https://picsum.photos/seed/dolomites1/800/600',
          'https://picsum.photos/seed/dolomites2/800/600',
          'https://picsum.photos/seed/dolomites3/800/600',
        ]),
        isPublic: true,
        location: 'Dolomites, Italy',
        tags: JSON.stringify(['dolomites', 'hiking', 'mountains', 'adventure']),
        authorId: user3.id,
      },
    })

    const post4 = await db.post.create({
      data: {
        caption: 'Morning coffee with a view ☕ Paris is always a good idea.',
        images: JSON.stringify([
          'https://picsum.photos/seed/paris1/800/600',
        ]),
        isPublic: true,
        location: 'Paris, France',
        tags: JSON.stringify(['paris', 'france', 'coffee', 'morning']),
        authorId: user4.id,
      },
    })

    const post5 = await db.post.create({
      data: {
        caption: 'Beach vibes in Bali 🌴 This place is paradise on earth!',
        images: JSON.stringify([
          'https://picsum.photos/seed/bali1/800/600',
          'https://picsum.photos/seed/bali2/800/600',
        ]),
        isPublic: true,
        location: 'Bali, Indonesia',
        tags: JSON.stringify(['bali', 'indonesia', 'beach', 'tropical']),
        authorId: user1.id,
      },
    })

    const post6 = await db.post.create({
      data: {
        caption: 'Exploring ancient temples in Siem Reap 🛕 The history here is incredible.',
        images: JSON.stringify([
          'https://picsum.photos/seed/siemreap1/800/600',
          'https://picsum.photos/seed/siemreap2/800/600',
        ]),
        isPublic: true,
        location: 'Siem Reap, Cambodia',
        tags: JSON.stringify(['siemreap', 'cambodia', 'temples', 'history']),
        authorId: user2.id,
      },
    })

    // Create comments with replies
    const comment1 = await db.comment.create({
      data: { content: 'This is absolutely stunning! 😍', authorId: user2.id, postId: post1.id },
    })
    await db.comment.create({
      data: { content: 'Thank you so much! 🙏', authorId: user1.id, postId: post1.id, parentId: comment1.id },
    })
    await db.comment.create({
      data: { content: 'Santorini is on my bucket list!', authorId: user3.id, postId: post1.id },
    })
    await db.comment.create({
      data: { content: 'I miss Tokyo so much!', authorId: user1.id, postId: post2.id },
    })
    const comment5 = await db.comment.create({
      data: { content: 'The food there is amazing too 🍜', authorId: user4.id, postId: post2.id },
    })
    await db.comment.create({
      data: { content: 'Ramen is my favorite!', authorId: user1.id, postId: post2.id, parentId: comment5.id },
    })
    await db.comment.create({
      data: { content: 'What an incredible hike! How long did it take?', authorId: user1.id, postId: post3.id },
    })
    await db.comment.create({
      data: { content: 'Those views are worth every step 🏔️', authorId: user2.id, postId: post3.id },
    })
    await db.comment.create({
      data: { content: 'Paris mornings are the best ☕', authorId: user3.id, postId: post4.id },
    })
    await db.comment.create({
      data: { content: 'Bali is calling my name! 🌴', authorId: user4.id, postId: post5.id },
    })

    // Create likes (using userId, not authorId)
    await db.like.createMany({
      data: [
        { userId: user2.id, postId: post1.id },
        { userId: user3.id, postId: post1.id },
        { userId: user4.id, postId: post1.id },
        { userId: user1.id, postId: post2.id },
        { userId: user3.id, postId: post2.id },
        { userId: user1.id, postId: post3.id },
        { userId: user2.id, postId: post3.id },
        { userId: user4.id, postId: post3.id },
        { userId: user3.id, postId: post4.id },
        { userId: user1.id, postId: post4.id },
        { userId: user4.id, postId: post5.id },
        { userId: user2.id, postId: post5.id },
        { userId: user3.id, postId: post5.id },
        { userId: user1.id, postId: post6.id },
        { userId: user4.id, postId: post6.id },
      ],
    })

    // Create bookmarks
    await db.bookmark.createMany({
      data: [
        { userId: user1.id, postId: post2.id },
        { userId: user1.id, postId: post3.id },
        { userId: user2.id, postId: post1.id },
        { userId: user2.id, postId: post5.id },
        { userId: user3.id, postId: post4.id },
      ],
    })

    // Create stories
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await db.story.createMany({
      data: [
        {
          mediaUrl: 'https://picsum.photos/seed/story1/800/1200',
          mediaType: 'image',
          caption: 'Breakfast with a view 🥐',
          authorId: user1.id,
          expiresAt: tomorrow,
        },
        {
          mediaUrl: 'https://picsum.photos/seed/story2/800/1200',
          mediaType: 'image',
          caption: 'Exploring local markets 🏪',
          authorId: user2.id,
          expiresAt: tomorrow,
        },
        {
          mediaUrl: 'https://picsum.photos/seed/story3/800/1200',
          mediaType: 'image',
          caption: 'Mountain sunrise 🌄',
          authorId: user3.id,
          expiresAt: tomorrow,
        },
        {
          mediaUrl: 'https://picsum.photos/seed/story4/800/1200',
          mediaType: 'image',
          caption: 'Street art hunting 🎨',
          authorId: user4.id,
          expiresAt: tomorrow,
        },
        {
          mediaUrl: 'https://picsum.photos/seed/story5/800/1200',
          mediaType: 'image',
          caption: 'Local cuisine adventures 🍜',
          authorId: user1.id,
          expiresAt: tomorrow,
        },
      ],
    })

    // Create communities
    const community1 = await db.community.create({
      data: {
        name: 'Solo Travelers',
        description: 'A community for solo travel enthusiasts. Share tips, stories, and find travel buddies!',
        image: 'https://picsum.photos/seed/community1/400/400',
        members: 12500,
        category: 'travel-style',
      },
    })

    const community2 = await db.community.create({
      data: {
        name: 'Budget Travel',
        description: 'Travel the world without breaking the bank. Tips on cheap flights, hostels, and more!',
        image: 'https://picsum.photos/seed/community2/400/400',
        members: 28700,
        category: 'budget',
      },
    })

    const community3 = await db.community.create({
      data: {
        name: 'Adventure & Hiking',
        description: 'For the thrill-seekers and mountain lovers. Share your adventure stories and trail recommendations!',
        image: 'https://picsum.photos/seed/community3/400/400',
        members: 19300,
        category: 'adventure',
      },
    })

    const community4 = await db.community.create({
      data: {
        name: 'Food & Travel',
        description: 'Discover the world through its cuisine. Local food guides, restaurant recommendations, and culinary adventures!',
        image: 'https://picsum.photos/seed/community4/400/400',
        members: 34100,
        category: 'food',
      },
    })

    const community5 = await db.community.create({
      data: {
        name: 'Photography',
        description: 'Capture the beauty of travel. Share your best travel photos and get feedback from fellow photographers!',
        image: 'https://picsum.photos/seed/community5/400/400',
        members: 22800,
        category: 'photography',
      },
    })

    const community6 = await db.community.create({
      data: {
        name: 'Digital Nomads',
        description: 'Work remotely while exploring the world. Tips on coworking spaces, visas, and nomad-friendly destinations!',
        image: 'https://picsum.photos/seed/community6/400/400',
        members: 41600,
        category: 'remote-work',
      },
    })

    // Create community members
    await db.communityMember.createMany({
      data: [
        { userId: user1.id, communityId: community1.id, role: 'admin' },
        { userId: user2.id, communityId: community1.id, role: 'member' },
        { userId: user3.id, communityId: community1.id, role: 'member' },
        { userId: user1.id, communityId: community2.id, role: 'member' },
        { userId: user4.id, communityId: community2.id, role: 'admin' },
        { userId: user2.id, communityId: community2.id, role: 'member' },
        { userId: user3.id, communityId: community3.id, role: 'admin' },
        { userId: user1.id, communityId: community3.id, role: 'member' },
        { userId: user4.id, communityId: community3.id, role: 'member' },
        { userId: user2.id, communityId: community4.id, role: 'admin' },
        { userId: user1.id, communityId: community4.id, role: 'member' },
        { userId: user3.id, communityId: community4.id, role: 'member' },
        { userId: user1.id, communityId: community5.id, role: 'member' },
        { userId: user3.id, communityId: community5.id, role: 'member' },
        { userId: user4.id, communityId: community5.id, role: 'admin' },
        { userId: user4.id, communityId: community6.id, role: 'member' },
        { userId: user1.id, communityId: community6.id, role: 'admin' },
        { userId: user2.id, communityId: community6.id, role: 'member' },
      ],
    })

    // Create shared posts
    await db.sharedPost.createMany({
      data: [
        {
          postId: post1.id,
          userId: user2.id,
          communityId: community1.id,
          caption: 'Amazing solo travel destination! Check this out 🌅',
        },
        {
          postId: post5.id,
          userId: user3.id,
          communityId: community3.id,
          caption: 'Bali beaches are perfect for adventure lovers! 🌴',
        },
      ],
    })

    // Create 2 chat rooms with messages
    // 1:1 chat room between user1 and user2
    const chatRoom1 = await db.chatRoom.create({
      data: {
        isGroup: false,
      },
    })

    await db.chatRoomMember.createMany({
      data: [
        { userId: user1.id, chatRoomId: chatRoom1.id },
        { userId: user2.id, chatRoomId: chatRoom1.id },
      ],
    })

    await db.message.createMany({
      data: [
        { content: 'Hey Sarah! How was Tokyo? 🏯', senderId: user1.id, chatRoomId: chatRoom1.id },
        { content: 'It was amazing! The food is incredible 🍜', senderId: user2.id, chatRoomId: chatRoom1.id },
        { content: 'I\'m so jealous! When are you going next?', senderId: user1.id, chatRoomId: chatRoom1.id },
        { content: 'Planning to go back in spring for cherry blossoms 🌸', senderId: user2.id, chatRoomId: chatRoom1.id },
        { content: 'Count me in! Let\'s plan together', senderId: user1.id, chatRoomId: chatRoom1.id },
      ],
    })

    // Group chat room
    const chatRoom2 = await db.chatRoom.create({
      data: {
        name: 'Bali Trip Planning 🌴',
        isGroup: true,
      },
    })

    await db.chatRoomMember.createMany({
      data: [
        { userId: user1.id, chatRoomId: chatRoom2.id },
        { userId: user2.id, chatRoomId: chatRoom2.id },
        { userId: user3.id, chatRoomId: chatRoom2.id },
        { userId: user4.id, chatRoomId: chatRoom2.id },
      ],
    })

    await db.message.createMany({
      data: [
        { content: 'Hey everyone! Who\'s up for a Bali trip? 🌴', senderId: user1.id, chatRoomId: chatRoom2.id },
        { content: 'I\'m in! When are we thinking?', senderId: user3.id, chatRoomId: chatRoom2.id },
        { content: 'How about next month? The weather should be perfect', senderId: user2.id, chatRoomId: chatRoom2.id },
        { content: 'I can help with the itinerary! I went last year', senderId: user4.id, chatRoomId: chatRoom2.id },
        { content: 'Perfect! Let\'s start planning 🗺️', senderId: user1.id, chatRoomId: chatRoom2.id },
        { content: 'I found some great budget options for villas', senderId: user4.id, chatRoomId: chatRoom2.id },
      ],
    })

    // Create 5 notifications
    await db.notification.createMany({
      data: [
        {
          userId: user1.id,
          type: 'like',
          message: 'Sarah Kim liked your post',
          fromUserId: user2.id,
          postId: post1.id,
        },
        {
          userId: user1.id,
          type: 'comment',
          message: 'Mike Johnson commented on your post',
          fromUserId: user3.id,
          postId: post3.id,
        },
        {
          userId: user2.id,
          type: 'follow',
          message: 'Alex Chen started following you',
          fromUserId: user1.id,
        },
        {
          userId: user3.id,
          type: 'like',
          message: 'Emma Wilson liked your post',
          fromUserId: user4.id,
          postId: post3.id,
        },
        {
          userId: user4.id,
          type: 'comment',
          message: 'Alex Chen commented on your post',
          fromUserId: user1.id,
          postId: post4.id,
        },
      ],
    })

    // Create post reports for testing
    await db.postReport.createMany({
      data: [
        {
          postId: post6.id,
          reporterId: user1.id,
          reason: 'Misleading information about temple entry requirements',
          status: 'pending',
        },
        {
          postId: post4.id,
          reporterId: user3.id,
          reason: 'Spam content - repeated posting of similar images',
          status: 'reviewed',
        },
        {
          postId: post2.id,
          reporterId: user4.id,
          reason: 'Inappropriate location tagging',
          status: 'dismissed',
        },
      ],
    })

    // Create sample itineraries
    const itinerary1 = await db.itinerary.create({
      data: {
        title: '7 Days in Japan',
        country: 'Japan',
        location: 'Tokyo, Kyoto, Osaka',
        budget: 3000,
        currency: 'USD',
        days: 7,
        travelType: 'solo',
        activities: JSON.stringify(['temple visits', 'food tours', 'shopping', 'hiking']),
        status: 'pre-travel',
        isPublic: true,
        requirements: JSON.stringify(['Valid passport', 'Japan tourist visa or visa exemption', 'JR Pass recommended']),
        authorId: user1.id,
        days_plan: {
          create: [
            {
              dayNumber: 1,
              title: 'Arrival in Tokyo',
              description: 'Arrive and explore the vibrant Shinjuku area',
              route: 'Narita Airport → Shinjuku via Narita Express',
              activities: {
                create: [
                  { title: 'Arrive at Narita Airport', description: 'Clear customs and pick up JR Pass', location: 'Narita Airport', startTime: '10:00', endTime: '12:00', cost: 0, order: 0 },
                  { title: 'Check into hotel', description: 'Drop off luggage and freshen up', location: 'Shinjuku', startTime: '13:00', endTime: '14:00', cost: 150, order: 1 },
                  { title: 'Explore Shinjuku', description: 'Walk around the bustling Shinjuku area', location: 'Shinjuku', startTime: '14:30', endTime: '18:00', cost: 20, order: 2 },
                  { title: 'Dinner at Izakaya', description: 'Experience authentic Japanese izakaya dining', location: 'Omoide Yokocho', startTime: '19:00', endTime: '21:00', cost: 40, order: 3 },
                ],
              },
            },
            {
              dayNumber: 2,
              title: 'Tokyo Culture Day',
              description: 'Visit traditional temples and modern attractions',
              route: 'Shinjuku → Asakusa → Akihabara → Shibuya',
              activities: {
                create: [
                  { title: 'Visit Senso-ji Temple', description: 'Explore Tokyo\'s oldest temple and surrounding area', location: 'Asakusa', startTime: '09:00', endTime: '11:30', cost: 0, order: 0 },
                  { title: 'Lunch at Asakusa', description: 'Try street food along Nakamise-dori', location: 'Asakusa', startTime: '12:00', endTime: '13:00', cost: 15, order: 1 },
                  { title: 'Explore Akihabara', description: 'Browse electronics and anime shops', location: 'Akihabara', startTime: '14:00', endTime: '17:00', cost: 30, order: 2 },
                  { title: 'Shibuya Crossing', description: 'Experience the world\'s busiest intersection', location: 'Shibuya', startTime: '18:00', endTime: '20:00', cost: 10, order: 3 },
                ],
              },
            },
            {
              dayNumber: 3,
              title: 'Day Trip to Hakone',
              description: 'Enjoy hot springs and views of Mount Fuji',
              route: 'Shinjuku → Hakone via Romancecar',
              activities: {
                create: [
                  { title: 'Train to Hakone', description: 'Take the scenic Romancecar from Shinjuku', location: 'Shinjuku Station', startTime: '08:00', endTime: '09:30', cost: 25, order: 0 },
                  { title: 'Hakone Open-Air Museum', description: 'Explore outdoor art installations', location: 'Hakone', startTime: '10:00', endTime: '12:00', cost: 15, order: 1 },
                  { title: 'Lake Ashi Cruise', description: 'Take a pirate ship cruise on the lake', location: 'Lake Ashi', startTime: '13:00', endTime: '14:30', cost: 12, order: 2 },
                  { title: 'Onsen experience', description: 'Relax in traditional hot springs', location: 'Hakone Yuryo', startTime: '15:00', endTime: '17:00', cost: 30, order: 3 },
                ],
              },
            },
          ],
        },
        budget_items: {
          create: [
            { name: 'Flights', amount: 800, category: 'transport', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
            { name: 'Accommodation (7 nights)', amount: 1050, category: 'accommodation', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
            { name: 'JR Pass (7 days)', amount: 280, category: 'transport', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
            { name: 'Food & Dining', amount: 500, category: 'food', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
            { name: 'Activities & Attractions', amount: 200, category: 'activities', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
            { name: 'Shopping & Souvenirs', amount: 170, category: 'shopping', paidBy: user1.id, splitAmong: JSON.stringify([user1.id]) },
          ],
        },
        companions: {
          create: [
            { name: 'Yuki Tanaka', email: 'yuki@example.com' },
          ],
        },
      },
    })

    const itinerary2 = await db.itinerary.create({
      data: {
        title: '5 Days in Bali',
        country: 'Indonesia',
        location: 'Ubud, Seminyak, Uluwatu',
        budget: 1500,
        currency: 'USD',
        days: 5,
        travelType: 'couple',
        activities: JSON.stringify(['beach', 'temple visits', 'surfing', 'rice terraces']),
        status: 'during-travel',
        isPublic: true,
        requirements: JSON.stringify(['Valid passport', 'Visa on arrival available', 'Travel insurance recommended']),
        authorId: user2.id,
        days_plan: {
          create: [
            {
              dayNumber: 1,
              title: 'Arrival in Ubud',
              description: 'Arrive and immerse in Balinese culture',
              route: 'Ngurah Rai Airport → Ubud via taxi',
              activities: {
                create: [
                  { title: 'Airport pickup', description: 'Arrive at Denpasar airport and transfer to Ubud', location: 'Ngurah Rai Airport', startTime: '14:00', endTime: '16:00', cost: 30, order: 0 },
                  { title: 'Check into villa', description: 'Settle into your private villa with pool', location: 'Ubud', startTime: '16:30', endTime: '17:30', cost: 120, order: 1 },
                  { title: 'Traditional dance show', description: 'Watch a Balinese Legong dance performance', location: 'Ubud Palace', startTime: '19:00', endTime: '20:30', cost: 10, order: 2 },
                ],
              },
            },
            {
              dayNumber: 2,
              title: 'Ubud Exploration',
              description: 'Rice terraces, temples, and local culture',
              route: 'Ubud center → Tegallalang → Monkey Forest',
              activities: {
                create: [
                  { title: 'Tegallalang Rice Terraces', description: 'Visit the iconic rice terraces at sunrise', location: 'Tegallalang', startTime: '07:00', endTime: '09:30', cost: 5, order: 0 },
                  { title: 'Coffee plantation tour', description: 'Sample Balinese coffee including luwak coffee', location: 'Ubud', startTime: '10:00', endTime: '11:30', cost: 10, order: 1 },
                  { title: 'Monkey Forest', description: 'Walk through the sacred monkey sanctuary', location: 'Ubud', startTime: '14:00', endTime: '16:00', cost: 5, order: 2 },
                  { title: 'Cooking class', description: 'Learn to cook authentic Balinese dishes', location: 'Ubud', startTime: '17:00', endTime: '20:00', cost: 35, order: 3 },
                ],
              },
            },
            {
              dayNumber: 3,
              title: 'Seminyak Beach Day',
              description: 'Relax on the beach and enjoy beach clubs',
              route: 'Ubud → Seminyak',
              activities: {
                create: [
                  { title: 'Transfer to Seminyak', description: 'Move to the beach area', location: 'Seminyak', startTime: '09:00', endTime: '10:30', cost: 20, order: 0 },
                  { title: 'Beach club', description: 'Relax at a luxury beach club', location: 'Potato Head Beach Club', startTime: '11:00', endTime: '16:00', cost: 50, order: 1 },
                  { title: 'Sunset dinner', description: 'Enjoy dinner on the beach at sunset', location: 'Seminyak Beach', startTime: '18:00', endTime: '20:00', cost: 40, order: 2 },
                ],
              },
            },
          ],
        },
        budget_items: {
          create: [
            { name: 'Flights', amount: 500, category: 'transport', paidBy: user2.id, splitAmong: JSON.stringify([user2.id]) },
            { name: 'Accommodation', amount: 500, category: 'accommodation', paidBy: user2.id, splitAmong: JSON.stringify([user2.id]) },
            { name: 'Food & Dining', amount: 250, category: 'food', paidBy: user2.id, splitAmong: JSON.stringify([user2.id]) },
            { name: 'Activities', amount: 150, category: 'activities', paidBy: user2.id, splitAmong: JSON.stringify([user2.id]) },
            { name: 'Transport', amount: 100, category: 'transport', paidBy: user2.id, splitAmong: JSON.stringify([user2.id]) },
          ],
        },
        companions: {
          create: [
            { name: 'James Lee', email: 'james@example.com', userId: user3.id },
          ],
        },
      },
    })

    const itinerary3 = await db.itinerary.create({
      data: {
        title: 'Weekend in Paris',
        country: 'France',
        location: 'Paris',
        budget: 2000,
        currency: 'USD',
        days: 3,
        travelType: 'couple',
        activities: JSON.stringify(['museums', 'food', 'shopping', 'sightseeing']),
        status: 'post-travel',
        isPublic: true,
        requirements: JSON.stringify(['Valid passport', 'Schengen visa if required', 'Museum pass recommended']),
        authorId: user4.id,
        days_plan: {
          create: [
            {
              dayNumber: 1,
              title: 'Iconic Paris',
              description: 'Visit the most famous landmarks',
              route: 'Hotel → Eiffel Tower → Seine Cruise → Notre Dame',
              activities: {
                create: [
                  { title: 'Eiffel Tower', description: 'Go to the top for panoramic views', location: 'Champ de Mars', startTime: '09:00', endTime: '12:00', cost: 25, order: 0, status: 'completed' },
                  { title: 'Seine River Cruise', description: 'Lunch cruise along the Seine', location: 'Port de la Bourdonnais', startTime: '13:00', endTime: '15:00', cost: 80, order: 1, status: 'completed' },
                  { title: 'Walk along Seine', description: 'Stroll through the riverside bouquinistes', location: 'Seine River Banks', startTime: '15:30', endTime: '17:00', cost: 0, order: 2, status: 'completed' },
                ],
              },
            },
            {
              dayNumber: 2,
              title: 'Art & Culture',
              description: 'Museums and artistic neighborhoods',
              route: 'Hotel → Louvre → Montmartre → Sacré-Cœur',
              activities: {
                create: [
                  { title: 'Louvre Museum', description: 'Explore the world\'s largest art museum', location: 'Louvre', startTime: '09:00', endTime: '13:00', cost: 17, order: 0, status: 'completed' },
                  { title: 'Lunch at Le Marais', description: 'Enjoy falafel and local delicacies', location: 'Le Marais', startTime: '13:30', endTime: '14:30', cost: 20, order: 1, status: 'completed' },
                  { title: 'Montmartre & Sacré-Cœur', description: 'Wander the artistic hilltop neighborhood', location: 'Montmartre', startTime: '15:30', endTime: '18:00', cost: 0, order: 2, status: 'completed' },
                ],
              },
            },
            {
              dayNumber: 3,
              title: 'Parisian Lifestyle',
              description: 'Shopping, cafes, and hidden gems',
              route: 'Hotel → Champs-Élysées → Galeries Lafayette → Canal Saint-Martin',
              activities: {
                create: [
                  { title: 'Champs-Élysées walk', description: 'Stroll down the famous avenue', location: 'Champs-Élysées', startTime: '09:00', endTime: '11:00', cost: 0, order: 0, status: 'completed' },
                  { title: 'Galeries Lafayette', description: 'Shop at the iconic department store', location: 'Galeries Lafayette', startTime: '11:30', endTime: '14:00', cost: 200, order: 1, status: 'completed' },
                  { title: 'Canal Saint-Martin', description: 'Relax by the canal with locals', location: 'Canal Saint-Martin', startTime: '15:00', endTime: '18:00', cost: 15, order: 2, status: 'completed' },
                ],
              },
            },
          ],
        },
        budget_items: {
          create: [
            { name: 'Flights', amount: 600, category: 'transport', paidBy: user4.id, splitAmong: JSON.stringify([user4.id]) },
            { name: 'Hotel (3 nights)', amount: 750, category: 'accommodation', paidBy: user4.id, splitAmong: JSON.stringify([user4.id]) },
            { name: 'Food', amount: 350, category: 'food', paidBy: user4.id, splitAmong: JSON.stringify([user4.id]) },
            { name: 'Museums & Activities', amount: 150, category: 'activities', paidBy: user4.id, splitAmong: JSON.stringify([user4.id]) },
            { name: 'Shopping', amount: 200, category: 'shopping', paidBy: user4.id, splitAmong: JSON.stringify([user4.id]) },
          ],
        },
        companions: {
          create: [
            { name: 'Lucas Martin', email: 'lucas@example.com' },
          ],
        },
      },
    })

    // Seed Platform Settings
    await db.platformSettings.createMany({
      data: [
        { key: 'site_name', value: 'Wanderlust' },
        { key: 'site_logo', value: '' },
        { key: 'site_description', value: 'Your social travel companion' },
        { key: 'contact_email', value: 'hello@wanderlust.app' },
        { key: 'contact_phone', value: '' },
        { key: 'contact_address', value: '' },
        { key: 'social_twitter', value: '' },
        { key: 'social_instagram', value: '' },
        { key: 'social_facebook', value: '' },
        { key: 'maintenance_mode', value: 'false' },
        { key: 'registration_open', value: 'true' },
        { key: 'max_upload_size', value: '10' },
        { key: 'default_language', value: 'en' },
        { key: 'primary_color', value: '#FF6B6B' },
        { key: 'accent_color', value: '#FF8C42' },
      ],
    })

    // Seed Feature Toggles
    await db.featureToggle.createMany({
      data: [
        { key: 'stories', label: 'Stories', description: 'Allow users to post stories', enabled: true, category: 'content' },
        { key: 'comments', label: 'Comments', description: 'Allow users to comment on posts', enabled: true, category: 'content' },
        { key: 'likes', label: 'Likes', description: 'Allow users to like posts', enabled: true, category: 'content' },
        { key: 'bookmarks', label: 'Bookmarks', description: 'Allow users to save/bookmark posts', enabled: true, category: 'content' },
        { key: 'sharing', label: 'Post Sharing', description: 'Allow sharing posts to communities', enabled: true, category: 'content' },
        { key: 'reports', label: 'Report System', description: 'Allow users to report content', enabled: true, category: 'moderation' },
        { key: 'ai_itinerary', label: 'AI Itinerary Generator', description: 'AI-powered itinerary creation', enabled: true, category: 'features' },
        { key: 'dark_mode', label: 'Dark Mode', description: 'Allow dark mode theme', enabled: true, category: 'features' },
        { key: 'private_accounts', label: 'Private Accounts', description: 'Allow users to set accounts private', enabled: true, category: 'features' },
        { key: 'registration', label: 'User Registration', description: 'Allow new user signups', enabled: true, category: 'access' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Put site in maintenance mode', enabled: false, category: 'access' },
        { key: 'community_creation', label: 'Community Creation', description: 'Allow users to create communities', enabled: true, category: 'community' },
        { key: 'messaging', label: 'Direct Messaging', description: 'Allow users to send direct messages', enabled: true, category: 'community' },
        { key: 'notifications', label: 'Push Notifications', description: 'Send push notifications to users', enabled: true, category: 'community' },
      ],
    })

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      data: {
        users: 4,
        posts: 6,
        stories: 5,
        communities: 6,
        communityMembers: 18,
        sharedPosts: 2,
        chatRooms: 2,
        notifications: 5,
        bookmarks: 5,
        reports: 3,
        itineraries: [itinerary1.id, itinerary2.id, itinerary3.id],
        platformSettings: 15,
        featureToggles: 14,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
