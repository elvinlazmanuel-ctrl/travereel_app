import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { country, location, budget, days, activities, travelType, departureDate, returnDate, departureTime, arrivalTime, hasHotel } = body

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

    // Build user message with optional flight/hotel details
    let userMessage = `Generate a detailed ${days}-day travel itinerary for ${location}, ${country}.`
    
    if (departureDate) {
      userMessage += `\nDeparture Date: ${departureDate}`
    }
    if (returnDate) {
      userMessage += `\nReturn Date: ${returnDate}`
    }
    if (departureTime) {
      userMessage += `\nFlight Departure Time: ${departureTime}`
    }
    if (arrivalTime) {
      userMessage += `\nFlight Arrival Time: ${arrivalTime}`
    }
    
    userMessage += `\nBudget: ${budget || 'flexible'} USD`
    userMessage += `\nTravel type: ${travelType || 'solo'}`
    userMessage += `\nPreferred activities: ${activities || 'general sightseeing'}`
    userMessage += `\n\nPlease provide a comprehensive day-by-day itinerary.`

    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Travereel',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert travel planner. Generate detailed day-by-day travel itineraries based on the user's preferences.

CRITICAL: You MUST generate EXACTLY the number of days requested by the user. If they ask for 5 days, you MUST return exactly 5 days in the "days" array. If they ask for 7 days, you MUST return exactly 7 days. This is non-negotiable.

CRITICAL PRIVACY RULES:
- NEVER include specific hotel names in the itinerary
- Use generic terms like "Check in to Hotel", "Hotel Check-in", or "Accommodation" instead
- If the user hasn't booked a hotel yet, you may optionally suggest a hotel AREA (not specific hotel name) with a note: "Consider staying in [area name] area - Browse hotels on Booking.com"
- If flight times are provided, schedule activities AROUND the flight times (don't plan activities during travel)

CRITICAL: You MUST return your response as a valid JSON object. Use ONLY straight quotes (" "), NEVER curly quotes (" " " ").

The JSON must have this exact structure:

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
- **YOU MUST CREATE EXACTLY THE NUMBER OF DAYS REQUESTED** - This is the most important rule
- dayNumber must be sequential: 1, 2, 3, 4, 5, etc. up to the requested number of days
- Each day should have a unique dayNumber
- All costs should be in USD
- startTime and endTime should be in HH:MM format
- Include 3-5 activities per day (adjust based on arrival/departure times)
- Consider travel time between locations
- Include realistic estimated costs
- Provide practical travel advice in the route field
- Use ONLY straight double quotes for all strings
- For accommodation: Use "Check in to Hotel" or similar generic text, NEVER specific hotel names
- For hotel recommendations: Only suggest areas, not specific hotels. Add "Browse hotels on Booking.com" note
- For flights: If departure/arrival times provided, plan activities around them
- Return ONLY the JSON object, no other text, no markdown formatting`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
      signal: controller.signal,
    })

    // Clear the timeout since we got a response
    clearTimeout(timeoutId)

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

    // Fix curly/smart quotes that break JSON parsing
    // Replace curly double quotes with straight quotes
    jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '"')
    // Replace curly single quotes with straight quotes
    jsonStr = jsonStr.replace(/[\u2018\u2019]/g, "'")

    let parsedItinerary
    try {
      parsedItinerary = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response as JSON:', jsonStr.substring(0, 500))
      return NextResponse.json(
        { error: 'Failed to parse AI-generated itinerary', raw: content },
        { status: 500 }
      )
    }

    return NextResponse.json({ itinerary: parsedItinerary })
  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('AI itinerary generation timed out after 60 seconds')
      return NextResponse.json(
        { 
          error: 'Request timed out', 
          details: 'AI service took too long to respond. Please try again.',
          timeout: true
        },
        { status: 504 }
      )
    }
    
    console.error('Generate itinerary error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
