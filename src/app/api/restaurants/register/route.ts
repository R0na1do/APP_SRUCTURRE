import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const sb = supabaseServer()
    const body = await request.json()
    
    const { name, description, phone, address, slug } = body

    // Validate required fields
    if (!name || !description || !phone || !address || !slug) {
      return NextResponse.json({ 
        error: 'All fields are required: name, description, phone, address, slug' 
      }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existingRestaurant } = await sb
      .from('restaurants')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingRestaurant) {
      return NextResponse.json({ 
        error: 'A restaurant with this name already exists. Please choose a different name.' 
      }, { status: 409 })
    }

    // Create the restaurant
    const { data: restaurant, error } = await sb
      .from('restaurants')
      .insert({
        name,
        description,
        phone,
        address,
        slug,
        owner_user_id: null, // Will be set when authentication is added
        avg_rating: 0,
        review_count: 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: `Failed to create restaurant: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      restaurant,
      message: 'Restaurant created successfully!'
    })

  } catch (error) {
    console.error('Restaurant registration error:', error)
    return NextResponse.json({ 
      error: 'Failed to register restaurant',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
