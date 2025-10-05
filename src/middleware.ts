import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily disable middleware for testing
  console.log('Middleware: Accessing', req.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}