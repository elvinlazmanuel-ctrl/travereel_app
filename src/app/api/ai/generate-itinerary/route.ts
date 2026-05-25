import { NextResponse } from 'next/server'
import { validateDayFeasibility } from '@/lib/geographic-utils'

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
    
    console.log(`Generating ${days}-day itinerary for ${location}, ${country}`)
    console.log(`Budget: ${budget}, Travel Type: ${travelType}, Activities: ${activities}`)
    
    // Calculate appropriate timeout based on number of days
    // Longer itineraries need more time (30s per day, minimum 60s, maximum 300s)
    const timeoutMs = Math.min(Math.max(days * 30000, 60000), 300000)
    console.log(`Timeout set to: ${timeoutMs / 1000}s for ${days} days`)
    
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
    userMessage += `\n\nIMPORTANT: Generate EXACTLY ${days} days. Do not generate only 1 day. Create a full ${days}-day itinerary with dayNumber 1 through ${days}.`
    userMessage += `\n\nPlease provide a comprehensive day-by-day itinerary.`

    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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

CRITICAL: For multi-city itineraries (multiple cities listed), distribute the days evenly across all cities. For example, if 14 days and 7 cities, spend approximately 2 days per city.

CRITICAL PRIVACY RULES:
- NEVER include specific hotel names in the itinerary
- Use generic terms like "Check in to Hotel", "Hotel Check-in", or "Accommodation" instead
- If the user hasn't booked a hotel yet, you may optionally suggest a hotel AREA (not specific hotel name) with a note: "Consider staying in [area name] area - Browse hotels on Booking.com"
- If flight times are provided, schedule activities AROUND the flight times (don't plan activities during travel)

CRITICAL: You MUST return your response as a valid JSON object. Use ONLY straight quotes (" "), NEVER curly quotes (" " " ").

The JSON must have this exact structure. NOTE: The "days" array MUST contain EXACTLY the number of days requested:

{
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival and Exploration",
      "description": "Arrive and get oriented",
      "activities": [
        {
          "title": "Check in to Hotel",
          "description": "Settle into your accommodation",
          "location": "Hotel area",
          "startTime": "14:00",
          "endTime": "15:00",
          "cost": 0
        },
        {
          "title": "Evening Walk",
          "description": "Explore the local area",
          "location": "City center",
          "startTime": "17:00",
          "endTime": "19:00",
          "cost": 0
        }
      ],
      "route": "From airport to hotel via taxi"
    }
  ],
  "requirements": [
    "Valid passport with 6 months validity",
    "Return ticket"
  ],
  "totalEstimatedCost": 1500
}

IMPORTANT: The example above shows 1 day, but you MUST generate the EXACT number of days the user requested. If they want 14 days, create dayNumber 1 through 14. Each day must be in a separate object in the array.

Important rules:
- **YOU MUST CREATE EXACTLY THE NUMBER OF DAYS REQUESTED** - Count them: 1, 2, 3... up to the requested number
- For multi-city trips, distribute days across all cities mentioned
- dayNumber must be sequential starting from 1
- Each day should have a unique dayNumber
- All costs should be in USD
- startTime and endTime should be in HH:MM format
- Include 2-4 activities per day (keep it concise to avoid response truncation)
- Consider travel time between locations
- Include realistic estimated costs
- Provide practical travel advice in the route field
- Use ONLY straight double quotes for all strings
- For accommodation: Use "Check in to Hotel" or similar generic text, NEVER specific hotel names
- For hotel recommendations: Only suggest areas, not specific hotels. Add "Browse hotels on Booking.com" note
- For flights: If departure/arrival times provided, plan activities around them
- Return ONLY the JSON object, no other text, no markdown formatting
- Keep descriptions concise to ensure the complete response fits within token limits`,
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

    console.log(`AI response length: ${content.length} characters`)

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

    // Check if response appears to be truncated (ends abruptly without closing braces)
    const openBraces = (jsonStr.match(/{/g) || []).length
    const closeBraces = (jsonStr.match(/}/g) || []).length
    const openBrackets = (jsonStr.match(/\[/g) || []).length
    const closeBrackets = (jsonStr.match(/\]/g) || []).length
    
    let parsedItinerary
    
    if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
      console.warn('Response appears truncated - mismatched braces/brackets')
      console.warn(`Braces: { ${openBraces} } ${closeBraces}, Brackets: [ ${openBrackets} ] ${closeBrackets}`)
      
      // Try to repair truncated JSON by removing incomplete last objects
      // Find the last complete day object and trim after it
      const lastCompleteDayMatch = jsonStr.match(/"dayNumber"\s*:\s*\d+[\s\S]*?"activities"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/g)
      if (lastCompleteDayMatch && lastCompleteDayMatch.length > 0) {
        console.log(`Attempting to repair: found ${lastCompleteDayMatch.length} complete day objects`)
        // Reconstruct JSON with complete days only
        const lastDay = lastCompleteDayMatch[lastCompleteDayMatch.length - 1]
        const lastDayEnd = jsonStr.lastIndexOf(lastDay) + lastDay.length
        const truncatedJson = jsonStr.substring(0, lastDayEnd) + '], "requirements": [], "totalEstimatedCost": 0}'
        
        try {
          parsedItinerary = JSON.parse(truncatedJson)
          console.log(`Successfully repaired JSON with ${parsedItinerary.days?.length} days`)
        } catch (repairError) {
          console.error('Repair attempt failed:', repairError)
          return NextResponse.json(
            { 
              error: 'AI response was truncated and could not be repaired',
              details: 'The AI service returned an incomplete response. Please try again with fewer days or fewer cities.',
              truncated: true,
              daysGenerated: lastCompleteDayMatch.length
            },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { 
            error: 'AI response was truncated',
            details: 'The AI service returned an incomplete response. Please try again with fewer days or fewer cities.',
            truncated: true
          },
          { status: 500 }
        )
      }
    } else {
      // Response appears complete, try to parse normally
      try {
        parsedItinerary = JSON.parse(jsonStr)
      } catch {
        console.error('Failed to parse AI response as JSON:', jsonStr.substring(0, 500))
        return NextResponse.json(
          { error: 'Failed to parse AI-generated itinerary', raw: content },
          { status: 500 }
        )
      }
    }

    // Validate that the AI returned the correct number of days
    const requestedDays = days
    const returnedDays = parsedItinerary?.days?.length || 0
    
    if (returnedDays !== requestedDays) {
      console.error(`AI returned ${returnedDays} days instead of requested ${requestedDays} days`)
      return NextResponse.json(
        { 
          error: `AI generated ${returnedDays} day${returnedDays !== 1 ? 's' : ''} instead of the requested ${requestedDays} days`,
          details: `Expected ${requestedDays} days but got ${returnedDays} days`,
          returnedDays,
          requestedDays
        },
        { status: 500 }
      )
    }

    // Validate geographic feasibility (if coordinates are available)
    const validationResults: Array<{
      day: number
      issues: string[]
      totalTravelTime: number
      totalDistance: number
    }> = []
    for (const day of parsedItinerary.days) {
      if (day.activities && day.activities.length > 0) {
        const feasibility = validateDayFeasibility(day.activities)
        if (!feasibility.feasible) {
          validationResults.push({
            day: day.dayNumber,
            issues: feasibility.issues,
            totalTravelTime: feasibility.totalTravelTime,
            totalDistance: feasibility.totalDistance,
          })
        }
      }
    }

    // Add validation warnings to response (but don't block)
    if (validationResults.length > 0) {
      console.warn('Itinerary geographic validation warnings:', validationResults)
    }

    return NextResponse.json({ 
      itinerary: parsedItinerary,
      validation: validationResults.length > 0 ? validationResults : undefined,
    })
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
