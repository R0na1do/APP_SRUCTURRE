'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import '../admin.css'

interface Restaurant {
  id: string
  name: string
  slug: string
  qr_url?: string
  created_at: string
  owner_user_id?: string
  owner_name?: string
  owner_email?: string
}

export default function QRCodePage() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadRestaurants = async () => {
    try {
      // Check if user is admin
      const superAdminEmails = [
        'admin@magicmenu.com',
        'owner@magicmenu.com',
        'ron.degtyar@gmail.com'
      ]
      
      const userIsAdmin = user?.email && superAdminEmails.includes(user.email)
      setIsAdmin(!!userIsAdmin)

      if (userIsAdmin) {
        // Admin view: Load all restaurants from localStorage or Supabase
        const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
        
        if (demoRestaurants.length > 0) {
          setRestaurants(demoRestaurants)
        } else {
          // Try to load from Supabase
          const { data: restaurantsData, error } = await sb
            .from('restaurants')
            .select('id, name, slug, qr_url, created_at')
            .order('created_at', { ascending: false })

          if (error) {
            console.log('Supabase not available, using demo data')
            // Use demo data if Supabase fails
            const mockRestaurants: Restaurant[] = [
              {
                id: 'demo-1',
                name: 'Bella Italia',
                slug: 'bella-italia',
                qr_url: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=QR+Code',
                created_at: new Date().toISOString()
              },
              {
                id: 'demo-2', 
                name: 'Café Luma',
                slug: 'cafe-luma',
                created_at: new Date(Date.now() - 86400000).toISOString()
              },
              {
                id: 'demo-3',
                name: 'Pizza Palace',
                slug: 'pizza-palace',
                qr_url: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=QR+Code',
                created_at: new Date(Date.now() - 172800000).toISOString()
              }
            ]
            setRestaurants(mockRestaurants)
          } else {
            setRestaurants(restaurantsData || [])
          }
        }
      } else {
        // Restaurant owner view: Load only their restaurants
        if (user?.id) {
          const { data: restaurantsData, error } = await sb
            .from('restaurants')
            .select('id, name, slug, qr_url, created_at')
            .eq('owner_user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.log('Supabase not available, using demo data for owner')
            // Use demo data if Supabase fails
            const mockRestaurants: Restaurant[] = [
              {
                id: 'owner-1',
                name: 'My Restaurant',
                slug: 'my-restaurant',
                created_at: new Date().toISOString()
              }
            ]
            setRestaurants(mockRestaurants)
          } else {
            setRestaurants(restaurantsData || [])
          }
        } else {
          setRestaurants([])
        }
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error)
      showToast(`Failed to load restaurants: ${error}`, 'warn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const generateQRCode = async (restaurantId: string) => {
    setGenerating(restaurantId)
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/qr`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        showToast('QR code generated successfully!')
        
        // Update the restaurant in the local state
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, qr_url: result.qr_url }
            : restaurant
        ))
        
        // Also update localStorage if using demo data
        if (typeof window !== 'undefined') {
          const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
          const updatedRestaurants = demoRestaurants.map((r: any) => 
            r.id === restaurantId 
              ? { ...r, qr_url: result.qr_url }
              : r
          )
          localStorage.setItem('demo_restaurants', JSON.stringify(updatedRestaurants))
        }
      } else {
        showToast(`Error generating QR code: ${result.error}`, 'warn')
      }
    } catch (error) {
      console.error('QR generation error:', error)
      showToast(`Failed to generate QR code: ${error}`, 'warn')
    } finally {
      setGenerating(null)
    }
  }

  const downloadQRCode = (qrUrl: string, restaurantName: string) => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `${restaurantName}-qr-code.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('QR code downloaded!')
  }

  const copyQRUrl = (restaurant: Restaurant) => {
    const menuUrl = `${window.location.origin}/r/${restaurant.slug}`
    navigator.clipboard.writeText(menuUrl)
    showToast('Menu URL copied to clipboard!')
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <div className="logo-sq">MM</div>
            <div className="brand-name">MagicMenu</div>
          </Link>
          <div className="seg" role="tablist">
            <Link href="/admin/restaurants" role="tab" aria-selected="false">
              My Restaurants
            </Link>
            <Link href="/admin/analytics" role="tab" aria-selected="false">
              Analytics
            </Link>
            <Link href="/admin/qr" className="active" role="tab" aria-selected="true">
              QR Codes
            </Link>
            <Link href="/admin/users" role="tab" aria-selected="false">
              Users
            </Link>
          </div>
          <div className="row">
            <Link href="/admin" className="btn small">Dashboard</Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Welcome, {user.user_metadata?.first_name || user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="btn small"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn small primary">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="wrap">
        <h1 className="h1">
          {isAdmin ? '📱 All QR Codes' : '📱 QR Code Generator'}
        </h1>
        <p className="lead">
          {isAdmin 
            ? 'View and manage QR codes for all restaurants in the system.' 
            : 'Generate QR codes for your restaurants to enable easy menu access for customers.'
          }
        </p>

        <div className="pills">
          <div className="pill active">Auto-generated</div>
          <div className="pill">High quality</div>
          <div className="pill">Print ready</div>
        </div>

        <div className="grid">
          <section className="card">
            <div className="head">
              <h2>
                {isAdmin ? '🏪 All Restaurant QR Codes' : '🏪 My Restaurant QR Codes'}
              </h2>
            </div>
            <div className="body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading restaurants...</p>
                </div>
              ) : restaurants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                  <h3>
                    {isAdmin ? 'No Restaurants Found' : 'No Restaurants Yet'}
                  </h3>
                  <p>
                    {isAdmin 
                      ? 'No restaurants have been registered in the system yet.'
                      : 'Create your first restaurant to generate QR codes.'
                    }
                  </p>
                  {!isAdmin && (
                    <Link 
                      href="/admin/register"
                      className="btn primary"
                      style={{ marginTop: '16px' }}
                    >
                      Create Restaurant
                    </Link>
                  )}
                </div>
              ) : (
                <div className="restaurants-list">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="restaurant-item">
                      <div className="restaurant-content">
                        <div className="restaurant-info">
                          <div className="restaurant-header">
                            <div>
                              <h4>{restaurant.name}</h4>
                              <p className="restaurant-slug">magicmenu.com/r/{restaurant.slug}</p>
                            </div>
                          </div>
                          
                          <div className="restaurant-details">
                            <div className="restaurant-detail">
                              <strong>📅 Created:</strong> {new Date(restaurant.created_at).toLocaleDateString()}
                            </div>
                            <div className="restaurant-detail">
                              <strong>🔗 Menu URL:</strong> <code>/r/{restaurant.slug}</code>
                            </div>
                            {isAdmin && restaurant.owner_name && (
                              <div className="restaurant-detail">
                                <strong>👤 Owner:</strong> {restaurant.owner_name}
                                {restaurant.owner_email && (
                                  <span style={{ color: '#666', marginLeft: '8px' }}>
                                    ({restaurant.owner_email})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="restaurant-stats">
                            <span className="badge">
                              {restaurant.qr_url ? '✅ QR Code Ready' : '❌ No QR Code'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="restaurant-actions">
                          {restaurant.qr_url ? (
                            <>
                              <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                <img 
                                  src={restaurant.qr_url} 
                                  alt={`QR Code for ${restaurant.name}`}
                                  style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    background: 'white'
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => downloadQRCode(restaurant.qr_url!, restaurant.name)}
                                className="btn small"
                                title="Download QR code"
                              >
                                📥 Download
                              </button>
                              <button
                                onClick={() => copyQRUrl(restaurant)}
                                className="btn small"
                                title="Copy Menu URL"
                              >
                                📋 Copy URL
                              </button>
                              <Link 
                                href={`/r/${restaurant.slug}`}
                                target="_blank"
                                className="btn small"
                                title="View restaurant"
                              >
                                👀 View Menu
                              </Link>
                            </>
                          ) : (
                            <button
                              onClick={() => generateQRCode(restaurant.id)}
                              className="btn small primary"
                              disabled={generating === restaurant.id}
                              title="Generate QR code"
                            >
                              {generating === restaurant.id ? '⏳ Generating...' : '📱 Generate QR'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="head">
              <h2>
                {isAdmin ? '📋 QR Code Management' : '📋 QR Code Instructions'}
              </h2>
            </div>
            <div className="body">
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {isAdmin ? (
                  <>
                    <h4>Admin QR Code Management:</h4>
                    <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                      <li>View all QR codes generated by restaurant owners</li>
                      <li>Download QR codes for any restaurant</li>
                      <li>Monitor QR code usage across all restaurants</li>
                      <li>Manage QR code generation for restaurants</li>
                    </ul>
                    
                    <h4>System Overview:</h4>
                    <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                      <li>Total restaurants: {restaurants.length}</li>
                      <li>QR codes generated: {restaurants.filter(r => r.qr_url).length}</li>
                      <li>Pending QR codes: {restaurants.filter(r => !r.qr_url).length}</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <h4>How to use QR codes:</h4>
                    <ol style={{ margin: '12px 0', paddingLeft: '20px' }}>
                      <li>Generate a QR code for your restaurant</li>
                      <li>Download and print the QR code</li>
                      <li>Place QR codes on tables, menus, or windows</li>
                      <li>Customers scan to view your digital menu</li>
                    </ol>
                    
                    <h4>Best practices:</h4>
                    <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                      <li>Print at least 2x2 inches for easy scanning</li>
                      <li>Place in well-lit areas</li>
                      <li>Test the QR code before printing</li>
                      <li>Include instructions for customers</li>
                    </ul>
                  </>
                )}
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.5)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginTop: '16px',
                  border: '1px solid var(--border)'
                }}>
                  <strong>💡 Pro tip:</strong> {isAdmin 
                    ? 'Use the QR code management tools to help restaurant owners optimize their digital menu experience.'
                    : 'QR codes work best when printed on white backgrounds with good contrast.'
                  }
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '26px', color: 'rgba(106,90,61,.8)' }}>
          © MagicMenu
        </footer>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.type === 'warn' ? 'warn' : 'ok'}`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
