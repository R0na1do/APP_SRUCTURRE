import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '5000'

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not found' }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json({ results: data.results })
    } else {
      return NextResponse.json({
        error: `Places API error: ${data.status}`,
        details: data.error_message
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Places API request failed:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch places data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
