'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import { getCurrentLocation, searchNearbyRestaurants } from '@/lib/google-places'

const SEARCH_SUGGESTIONS = [
  "Pizza near me", "Sushi downtown", "Best brunch spots", "Vegan restaurants", 
  "Italian pasta", "Thai food", "Coffee & desserts", "Steakhouse", "Ramen", "Tacos"
]

export default function Home() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAllRestaurants, setShowAllRestaurants] = useState(false)

  async function loadAllRestaurants() {
    const allResults: any[] = []
    
    // Load all restaurants from localStorage
    if (typeof window !== 'undefined') {
      const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
      const demoResults = demoRestaurants.map((restaurant: any) => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        avg_rating: restaurant.avg_rating || 0,
        review_count: restaurant.review_count || 0,
        description: restaurant.description,
        address: restaurant.address,
        isDemo: true
      }))
      
      allResults.push(...demoResults)
    }
    
    // Load from Supabase if available
    try {
      const sb = supabaseBrowser()
      const { data, error } = await sb.from('restaurants').select('id, name, slug, avg_rating, review_count').limit(20)
      if (!error && data) {
        allResults.push(...(data || []))
      }
    } catch (error) {
      console.log('Supabase not available, using demo data only')
    }
    
    setResults(allResults)
    setShowAllRestaurants(true)
  }

  async function search() {
    const allResults: any[] = []
    
    // First search localStorage demo restaurants
    if (typeof window !== 'undefined') {
      const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
      const demoResults = demoRestaurants.filter((restaurant: any) => 
        restaurant.name.toLowerCase().includes(q.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(q.toLowerCase()) ||
        restaurant.address?.toLowerCase().includes(q.toLowerCase())
      ).map((restaurant: any) => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        avg_rating: restaurant.avg_rating || 0,
        review_count: restaurant.review_count || 0,
        description: restaurant.description,
        address: restaurant.address,
        isDemo: true
      }))
      
      allResults.push(...demoResults)
    }
    
    // Then search Supabase (if available)
    try {
      const sb = supabaseBrowser()
      const { data, error } = await sb.from('restaurants').select('id, name, slug, avg_rating, review_count').ilike('name', `%${q}%`).limit(10)
      if (!error && data) {
        allResults.push(...(data || []))
      }
    } catch (error) {
      console.log('Supabase search not available, using demo data only')
    }
    
    setResults(allResults)
    setShowSuggestions(false)
  }

  async function searchNearby() {
    setIsLoading(true)

    try {
      const location = await getCurrentLocation()
      const nearbyPlaces = await searchNearbyRestaurants(location, 5000)

      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        setResults([])
        return
      }

      // Convert Google Places results to our format
      const formattedResults = nearbyPlaces.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        slug: place.place_id,
        avg_rating: place.rating || 0,
        review_count: place.user_ratings_total || 0,
        address: place.vicinity,
        isGooglePlace: true
      }))

      setResults(formattedResults)
    } catch (error) {
      console.error('Location search failed:', error)
      alert(`Location search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try searching manually.`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(value: string) {
    setQ(value)
    if (value.trim()) {
      const allSuggestions: string[] = []
      
      // Add restaurant names from localStorage
      if (typeof window !== 'undefined') {
        const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
        const restaurantNames = demoRestaurants.map((r: any) => r.name)
        allSuggestions.push(...restaurantNames)
      }
      
      // Add default suggestions
      allSuggestions.push(...SEARCH_SUGGESTIONS)
      
      const filtered = allSuggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 7)
      
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="min-h-screen" style={{
      margin: 0,
      fontFamily: '"Spectral", Georgia, serif',
      color: '#6a5a3d',
      background: `
        radial-gradient(1200px 700px at 75% 18%, rgba(255,255,255,.55) 0%, transparent 60%),
        radial-gradient(900px 600px at 25% 40%, rgba(255,255,255,.45) 0%, transparent 60%),
        radial-gradient(820px 640px at 60% 75%, rgba(249,224,176,.35) 0%, transparent 65%),
        linear-gradient(180deg, #fff8ea 0%, #f6ebcd 48%, #f7e5bf 100%)
      `
    }}>
      {/* Auth Buttons */}
      <div className="fixed right-10 top-7 flex gap-3">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '14px', 
              color: '#6a5a3d',
              fontFamily: '"Spectral", serif'
            }}>
              Welcome, {user.user_metadata?.first_name || user.email}
            </span>
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:bg-opacity-80"
              style={{
                background: 'transparent',
                border: '1px solid #6a5a3d',
                color: '#6a5a3d',
                fontFamily: '"Spectral", serif',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link 
              href="/auth/login" 
              className="px-4 py-2 rounded-full text-white font-semibold transition-all duration-300 hover:bg-opacity-80"
              style={{
                background: '#6a5a3d',
                border: '1px solid #6a5a3d',
                fontFamily: '"Spectral", serif',
                textDecoration: 'none'
              }}
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:bg-opacity-80"
              style={{
                background: 'transparent',
                border: '1px solid #6a5a3d',
                color: '#6a5a3d',
                fontFamily: '"Spectral", serif',
                textDecoration: 'none'
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Main Content */}
      <main className="text-center max-w-6xl mx-auto px-6" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        {/* Logo */}
        <Link 
          href={user ? "/admin" : "/"}
          className="mx-auto mb-5 grid place-items-center overflow-hidden"
          style={{
            width: 'min(212px, 40vw)',
            height: 'min(212px, 40vw)',
            borderRadius: '36px',
            background: 'linear-gradient(145deg, #fff7e7 0%, #ffe4b7 55%, #ffd788 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
           <img 
             src="/MagicMenu_Logo.png" 
             alt="MagicMenu Logo" 
             style={{ 
               width: '100%', 
               height: '100%',
               objectFit: 'contain',
               objectPosition: 'center center',
               transform: 'scale(1.4)'
             }}
           />
        </Link>

        {/* Title */}
        <h1 
          className="m-0 mb-3"
          style={{
            fontFamily: '"Cherry Cream Soda", cursive',
            fontSize: 'clamp(64px, 10vw, 150px)',
            color: '#6a5a3d',
            letterSpacing: '-1px'
          }}
        >
          MagicMenu
        </h1>

        {/* Tagline */}
        <div 
          className="mb-9"
          style={{
            fontSize: 'clamp(20px, 2.6vw, 36px)',
            color: '#6a5a3d',
            fontStyle: 'italic',
            fontFamily: '"Spectral", serif'
          }}
        >
          Visualize your next meal
        </div>

        {/* Search Bar */}
        <form 
          className="mx-auto flex items-center relative"
          style={{
            width: 'min(920px, 94vw)',
            background: 'linear-gradient(180deg, #fff8ea, #f6ebcd)',
            border: '1px solid #e7d9ba',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,.05)'
          }}
          onSubmit={(e) => { e.preventDefault(); search(); }}
        >
          {/* Search Icon */}
          <div className="flex items-center justify-center border-r" style={{ width: '56px', height: '64px', borderColor: '#e7d9ba' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6a5a3d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Search for restaurants"
            value={q}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 border-0 bg-transparent px-4 outline-none"
            style={{
              height: '64px',
              fontSize: 'clamp(18px, 1.9vw, 22px)',
              fontFamily: '"Spectral", serif',
              color: '#6a5a3d'
            }}
          />

          {/* Divider */}
          <div style={{ height: '36px', width: '1px', background: '#e7d9ba', marginRight: '10px' }}></div>

          {/* Location Button */}
          <button
            type="button"
            onClick={searchNearby}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 mr-2 rounded-full border font-semibold text-sm cursor-pointer transition-all duration-300"
            style={{
              height: '38px',
              border: '1px solid #6a5a3d',
              background: isLoading ? '#f6ebcd' : '#f1dfb2',
              color: '#6a5a3d',
              fontFamily: '"Spectral", serif',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#f6ebcd')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = '#f1dfb2')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6a5a3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l1.41-1.41M4.93 19.07l1.41-1.41"></path>
            </svg>
            <span>{isLoading ? 'Finding...' : 'Use my location'}</span>
          </button>

          {/* Search Button */}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 mr-2 rounded-xl border font-semibold cursor-pointer transition-all duration-300"
            style={{
              height: '44px',
              border: '1px solid #6a5a3d',
              background: '#fff8ea',
              color: '#6a5a3d',
              fontFamily: '"Spectral", serif',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1dfb2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff8ea'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6a5a3d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search</span>
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              className="absolute bg-white border rounded-2xl shadow-lg p-2"
              style={{
                top: '68px',
                left: '57px',
                right: '10px',
                background: '#fff8ea',
                border: '1px solid #e7d9ba',
                boxShadow: '0 18px 40px rgba(0,0,0,.08)',
                zIndex: 50
              }}
            >
              {suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{ color: '#6a5a3d' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f6ebcd'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    setQ(suggestion)
                    setShowSuggestions(false)
                    search()
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6a5a3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Browse All Restaurants Button */}
        <div className="mt-8">
          <button
            onClick={loadAllRestaurants}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border font-semibold cursor-pointer transition-all duration-300"
            style={{
              border: '1px solid #6a5a3d',
              background: '#fff8ea',
              color: '#6a5a3d',
              fontFamily: '"Spectral", serif',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1dfb2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff8ea'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6a5a3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
              <path d="M9 3v6M15 3v6M9 15v6M15 15v6"/>
            </svg>
            <span>Browse All Restaurants</span>
          </button>
        </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold" style={{ color: '#6a5a3d', fontFamily: '"Cherry Cream Soda", cursive' }}>
              {showAllRestaurants ? 'All Restaurants' : 'Search Results'}
            </h2>
            <p className="text-sm mt-2" style={{ color: '#8b6a42' }}>
              {results.length} restaurant{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {results.map(r => (
              <Link key={r.id} href={`/r/${r.slug}`} className="group">
                <div 
                  className="p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border"
                  style={{
                    background: 'rgba(255, 248, 234, 0.7)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(231, 217, 186, 0.5)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg group-hover:opacity-80 transition-opacity" style={{ color: '#6a5a3d' }}>
                        {r.name}
                      </div>
                      {r.description && (
                        <div className="text-sm mt-1 opacity-75" style={{ color: '#8b6a42' }}>
                          {r.description.length > 60 ? r.description.substring(0, 60) + '...' : r.description}
                        </div>
                      )}
                      <div className="text-sm mt-2" style={{ color: '#8b6a42' }}>
                        ⭐ {r.avg_rating?.toFixed?.(1) ?? '0.0'} ({r.review_count} reviews)
                        {r.address && <div className="text-xs mt-1" style={{ color: '#8b6a42' }}>{r.address}</div>}
                      </div>
                      {r.isDemo && (
                        <div className="text-xs mt-1 px-2 py-1 rounded-full inline-block" style={{ background: '#d3ad3a', color: 'white' }}>
                          Demo Restaurant
                        </div>
                      )}
                    </div>
                    <div className="group-hover:opacity-80 transition-opacity ml-4" style={{ color: '#8b6a42' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
