import ZAI from 'z-ai-web-dev-sdk'
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

    const zai = await ZAI.create()

    const userMessage = `Generate a detailed ${days}-day travel itinerary for ${location}, ${country}.
Budget: ${budget || 'flexible'} USD
Travel type: ${travelType || 'solo'}
Preferred activities: ${activities || 'general sightseeing'}

Please provide a comprehensive day-by-day itinerary.`

    const response = await zai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
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
      thinking: { type: 'disabled' },
    })

    const content = response.choices[0]?.message?.content || ''

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
