import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const restaurantId = params.id
    
    // For demo purposes, we'll generate a QR code for any restaurant ID
    // In a real app, you'd fetch the restaurant data from your database
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create a URL for the restaurant menu page
    // We'll use the restaurant ID as the slug for demo purposes
    const url = `${baseUrl}/r/${restaurantId}?src=qr`
    
    // Generate QR code as data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(url, { 
      margin: 2, 
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    return NextResponse.json({ 
      qr_url: qrDataUrl,
      encoded_url: url,
      restaurant_id: restaurantId,
      note: "QR code generated successfully!"
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
