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
  description: string
  phone: string
  address: string
  logo_url?: string
  qr_url?: string
  avg_rating: number
  review_count: number
  created_at: string
}

export default function RestaurantsPage() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)

  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadRestaurants = async () => {
    try {
      // First try to load from localStorage (demo mode)
      const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
      if (demoRestaurants.length > 0) {
        setRestaurants(demoRestaurants)
        setLoading(false)
        return
      }

      // If no demo restaurants, try Supabase
      if (!user) {
        setLoading(false)
        return
      }

      const { data: restaurantsData, error } = await sb
        .from('restaurants')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        showToast(`Error loading restaurants: ${error.message}`, 'warn')
        return
      }

      setRestaurants(restaurantsData || [])
    } catch (error) {
      showToast(`Failed to load restaurants: ${error}`, 'warn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [user])

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.options-dropdown')) {
        // Close all dropdowns
        document.querySelectorAll('[id^="options-"]').forEach(dropdown => {
          (dropdown as HTMLElement).style.display = 'none'
        })
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleDelete = async (restaurantId: string, restaurantName: string) => {
    if (!confirm(`Are you sure you want to delete "${restaurantName}"? This will permanently delete the restaurant and all its data.`)) {
      return
    }

    try {
      const { error } = await sb
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)

      if (error) {
        showToast(`Error deleting restaurant: ${error.message}`, 'warn')
        return
      }

      showToast('Restaurant deleted successfully!')
      loadRestaurants()
    } catch (error) {
      showToast(`Failed to delete restaurant: ${error}`, 'warn')
    }
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
            <Link href="/admin/restaurants" className="active" role="tab" aria-selected="true">
              My Restaurants
            </Link>
            <Link href="/admin/analytics" role="tab" aria-selected="false">
              Analytics
            </Link>
            <Link href="/admin/qr" role="tab" aria-selected="false">
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

      <main className="wrap" style={{ minHeight: '100vh', overflowY: 'auto' }}>
        <h1 className="h1">🏪 My Restaurants</h1>
        <p className="lead">Manage your restaurants and view their performance.</p>

        <div className="pills">
          <div className="pill active">All Restaurants</div>
          <div className="pill">With QR Codes</div>
          <div className="pill">With Logos</div>
        </div>

        <div className="grid">
          <section className="card">
            <div className="head">
              <h2>📋 Restaurant Management</h2>
            </div>
            <div className="body">
              <div className="row" style={{ marginBottom: '20px' }}>
                <Link href="/admin/register" className="btn primary">
                  ➕ Add New Restaurant
                </Link>
                <span className="hint">Register a new restaurant to get started</span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading restaurants...</p>
                </div>
              ) : restaurants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                  <h3>No Restaurants Yet</h3>
                  <p>Create your first restaurant to start building your digital menu.</p>
                  <Link 
                    href="/admin/register"
                    className="btn primary"
                    style={{ marginTop: '16px' }}
                  >
                    Create First Restaurant
                  </Link>
                </div>
              ) : (
                <div className="restaurants-list" style={{ maxHeight: 'none', overflow: 'visible' }}>
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="restaurant-item">
                      <div className="restaurant-content">
                        <div className="restaurant-info">
                          <div className="restaurant-header">
                            {restaurant.logo_url && (
                              <img 
                                src={restaurant.logo_url} 
                                alt={restaurant.name}
                                className="restaurant-logo"
                              />
                            )}
                            <div>
                              <h4>{restaurant.name}</h4>
                              <p className="restaurant-slug">magicmenu.com/r/{restaurant.slug}</p>
                            </div>
                          </div>
                          
                          {restaurant.description && (
                            <p className="restaurant-description">{restaurant.description}</p>
                          )}
                          
                          <div className="restaurant-details">
                            <div className="restaurant-detail">
                              <strong>📞 Phone:</strong> {restaurant.phone || 'Not set'}
                            </div>
                            <div className="restaurant-detail">
                              <strong>📍 Address:</strong> {restaurant.address || 'Not set'}
                            </div>
                            <div className="restaurant-detail">
                              <strong>⭐ Rating:</strong> {restaurant.avg_rating.toFixed(1)} ({restaurant.review_count} reviews)
                            </div>
                            <div className="restaurant-detail">
                              <strong>📅 Created:</strong> {new Date(restaurant.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="restaurant-stats">
                            <span className="badge">
                              {restaurant.logo_url ? '✅ Logo' : '❌ No Logo'}
                            </span>
                            <span className="badge">
                              {restaurant.qr_url ? '✅ QR Code' : '❌ No QR Code'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="restaurant-actions">
                          <div className="options-dropdown" style={{ position: 'relative', zIndex: 1000 }}>
                            <button
                              className="btn small"
                              style={{ 
                                background: '#3b82f6', 
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                const dropdown = document.getElementById(`options-${restaurant.id}`)
                                if (dropdown) {
                                  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                                    dropdown.style.display = 'block'
                                    dropdown.style.position = 'absolute'
                                    dropdown.style.top = '100%'
                                    dropdown.style.right = '0'
                                    dropdown.style.zIndex = '9999'
                                    dropdown.style.background = 'white'
                                    dropdown.style.border = '1px solid #ccc'
                                    dropdown.style.borderRadius = '8px'
                                    dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                                    dropdown.style.minWidth = '200px'
                                  } else {
                                    dropdown.style.display = 'none'
                                  }
                                }
                              }}
                            >
                              ⚙️ Options
                            </button>
                            
                            <div 
                              id={`options-${restaurant.id}`}
                              style={{ 
                                display: 'none',
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                zIndex: 9999,
                                minWidth: '200px',
                                padding: '8px 0'
                              }}
                            >
                              <Link 
                                href={`/r/${restaurant.slug}`}
                                target="_blank"
                                style={{
                                  display: 'block',
                                  padding: '8px 16px',
                                  textDecoration: 'none',
                                  color: '#333',
                                  borderBottom: '1px solid #eee'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                👀 View Restaurant
                              </Link>
                              
                              <Link 
                                href="/admin/logos"
                                style={{
                                  display: 'block',
                                  padding: '8px 16px',
                                  textDecoration: 'none',
                                  color: '#333',
                                  borderBottom: '1px solid #eee'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                📸 Manage Logo
                              </Link>
                              
                              <Link 
                                href="/admin/dishes"
                                style={{
                                  display: 'block',
                                  padding: '8px 16px',
                                  textDecoration: 'none',
                                  color: '#333',
                                  borderBottom: '1px solid #eee'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                🍕 Manage Menu
                              </Link>
                              
                              <Link 
                                href="/admin/categories"
                                style={{
                                  display: 'block',
                                  padding: '8px 16px',
                                  textDecoration: 'none',
                                  color: '#333',
                                  borderBottom: '1px solid #eee'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                📂 Manage Categories
                              </Link>
                              
                              <Link 
                                href="/admin/qr"
                                style={{
                                  display: 'block',
                                  padding: '8px 16px',
                                  textDecoration: 'none',
                                  color: '#333',
                                  borderBottom: '1px solid #eee'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                📱 View QR Code
                              </Link>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(restaurant.id, restaurant.name)
                                  // Close dropdown after action
                                  const dropdown = document.getElementById(`options-${restaurant.id}`)
                                  if (dropdown) dropdown.style.display = 'none'
                                }}
                                style={{ 
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px 16px',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  fontWeight: '500',
                                  borderTop: '1px solid #eee'
                                }}
                              >
                                🗑️ Delete Restaurant
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '26px', color: 'rgba(106,90,61,.8)' }}>
          © MagicMenu
        </footer>
        
        {/* Scroll to top button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            fontSize: '20px'
          }}
          title="Scroll to top"
        >
          ↑
        </button>
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