import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId, messageHistory } = body

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's travel history for context
    let travelContext = ''
    try {
      const itineraries = await db.itinerary.findMany({
        where: { authorId: userId },
        select: {
          country: true,
          location: true,
          days: true,
          budget: true,
          travelType: true,
        },
        take: 5,
      })

      if (itineraries.length > 0) {
        travelContext = `\n\nUser's Travel History:\n${itineraries
          .map((i: any) => `- ${i.location}, ${i.country} (${i.days} days, $${i.budget}, ${i.travelType})`)
          .join('\n')}`
      }
    } catch (error) {
      console.log('Could not fetch travel history')
    }

    // Build system prompt
    const systemPrompt = `You are an expert AI Travel Assistant for Travereel, a travel social platform. 

Your role:
- Provide personalized travel recommendations
- Help with trip planning and itineraries
- Suggest budget-friendly options
- Share travel tips and insights
- Recommend destinations based on preferences

Guidelines:
- Be friendly and enthusiastic
- Give specific, actionable advice
- Consider the user's travel history when relevant
- Keep responses concise (2-4 paragraphs)
- Use emojis appropriately
- Always suggest 3-4 follow-up questions

${travelContext}

Respond helpfully to the user's travel question.`

    // Build conversation history
    const conversationHistory = messageHistory
      ? messageHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }))
      : []

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://travereel.com',
        'X-Title': 'Travereel AI Assistant',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct', // Cost-effective and fast
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openRouterResponse.ok) {
      throw new Error('OpenRouter API error')
    }

    const data = await openRouterResponse.json()
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not process that.'

    // Generate follow-up suggestions
    const suggestions = generateSuggestions(message, aiResponse)

    return NextResponse.json({
      response: aiResponse,
      suggestions,
    })
  } catch (error) {
    console.error('AI Travel Assistant error:', error)
    
    // Fallback responses based on common questions
    const fallbackResponse = getFallbackResponse(error instanceof Error ? error.message : '')
    
    return NextResponse.json({
      response: fallbackResponse,
      suggestions: [
        'Tell me about budget destinations',
        'Best time to travel to Europe',
        'How to plan a trip',
      ],
    })
  }
}

function generateSuggestions(userMessage: string, aiResponse: string): string[] {
  // Context-aware suggestions
  const suggestions: string[] = []

  if (userMessage.toLowerCase().includes('budget')) {
    suggestions.push('Cheapest destinations', 'Money-saving tips', 'Free activities')
  } else if (userMessage.toLowerCase().includes('japan') || userMessage.toLowerCase().includes('asia')) {
    suggestions.push('Best temples to visit', 'Local food recommendations', 'Transportation tips')
  } else if (userMessage.toLowerCase().includes('europe')) {
    suggestions.push('Rail pass guide', 'Hidden gems', 'Budget hostels')
  } else if (userMessage.toLowerCase().includes('pack')) {
    suggestions.push('Travel essentials', 'Carry-on only tips', 'Tech gadgets')
  } else {
    suggestions.push('More destination ideas', 'Travel insurance tips', 'Best travel apps')
  }

  return suggestions.slice(0, 4)
}

function getFallbackResponse(errorMessage: string): string {
  return `I'm currently experiencing some technical difficulties, but I'm still here to help! 😊

Here are some quick tips while we get things sorted:

🎯 **Popular Destinations:** Japan, Thailand, Italy, Iceland
💰 **Budget-Friendly:** Vietnam, Portugal, Mexico, Turkey
📅 **Best Time to Book:** 2-3 months before travel
✈️ **Money-Saving:** Use flight comparison tools, travel mid-week

Feel free to ask me anything else!`
}
