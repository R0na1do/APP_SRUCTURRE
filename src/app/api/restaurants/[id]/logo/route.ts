import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseServer()
    
    // Check if restaurant exists
    const { data: restaurant, error: restaurantError } = await sb
      .from('restaurants')
      .select('id, name')
      .eq('id', params.id)
      .single()
    
    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${restaurant.id}/logo.${fileExt}`
    
    // Upload to Supabase storage
    const { error: uploadError } = await sb.storage
      .from('resturant-logos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicData } = sb.storage
      .from('resturant-logos')
      .getPublicUrl(fileName)

    // Update restaurant record
    const { error: updateError } = await sb
      .from('restaurants')
      .update({ logo_url: publicData.publicUrl })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      logo_url: publicData.publicUrl,
      message: `Logo uploaded successfully for ${restaurant.name}`
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
