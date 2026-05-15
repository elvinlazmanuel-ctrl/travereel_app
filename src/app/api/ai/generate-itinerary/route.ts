import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { country, location, budget, days, activities, travelType } = body

    if (!country || !location || !days) {
      return NextResponse.json(
        { error: 'Country, location, and days are required' },
        { status: 400 }
      )
    }

    // Check if OpenRouter API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    
    console.log('API Key present:', !!apiKey)
    console.log('API Key starts with:', apiKey?.substring(0, 10))
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'AI service not configured. Please add OPENROUTER_API_KEY or OPENAI_API_KEY to environment variables.',
          hint: 'Get a free API key from https://openrouter.ai'
        },
        { status: 500 }
      )
    }

    const userMessage = `Generate a detailed ${days}-day travel itinerary for ${location}, ${country}.
Budget: ${budget || 'flexible'} USD
Travel type: ${travelType || 'solo'}
Preferred activities: ${activities || 'general sightseeing'}

Please provide a comprehensive day-by-day itinerary.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Travereel',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert travel planner. Generate detailed day-by-day travel itineraries based on the user's preferences.

You MUST return your response as a valid JSON object with the following structure (no markdown, no code blocks, just raw JSON):

{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "description": "Brief overview of the day",
      "activities": [
        {
          "title": "Activity title",
          "description": "Activity description",
          "location": "Specific location name",
          "startTime": "09:00",
          "endTime": "11:00",
          "cost": 25
        }
      ],
      "route": "Transportation notes between locations"
    }
  ],
  "requirements": [
    "Visa requirement if applicable",
    "Vaccination requirement if applicable",
    "Any other travel requirements"
  ],
  "totalEstimatedCost": 1500
}

Important rules:
- All costs should be in USD
- startTime and endTime should be in HH:MM format
- Include 3-5 activities per day
- Consider travel time between locations
- Include realistic estimated costs
- Provide practical travel advice in the route field
- Return ONLY the JSON object, no other text`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    })

    console.log('OpenRouter response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', JSON.stringify(errorData, null, 2))
      return NextResponse.json(
        { 
          error: 'AI service error', 
          details: errorData.error?.message || errorData.message || `HTTP ${response.status}`,
          status: response.status
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = content.trim()

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let parsedItinerary
    try {
      parsedItinerary = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response as JSON:', content)
      return NextResponse.json(
        { error: 'Failed to parse AI-generated itinerary', raw: content },
        { status: 500 }
      )
    }

    return NextResponse.json({ itinerary: parsedItinerary })
  } catch (error) {
    console.error('Generate itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
