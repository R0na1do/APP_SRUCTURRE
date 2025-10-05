'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import './admin.css'

interface DashboardStats {
  total_restaurants: number
  total_menu_items: number
  total_categories: number
  total_reviews: number
}

interface ActivityItem {
  time: string
  user: string
  action: string
  target: string
  status: 'ok' | 'warn' | 'bad'
}

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [filteredActivity, setFilteredActivity] = useState<ActivityItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)
  const [searchResults, setSearchResults] = useState<{
    restaurants: any[]
    users: any[]
  }>({ restaurants: [], users: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)

  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadStats = async () => {
    try {
      // For now, use mock data to test the page loading
      setStats({
        total_restaurants: 2,
        total_menu_items: 15,
        total_categories: 4,
        total_reviews: 8
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      showToast(`Failed to load dashboard stats: ${error}`, 'warn')
    } finally {
      setLoading(false)
    }
  }

  const loadActivity = async () => {
    try {
      // Mock activity data for now
      const mockActivity: ActivityItem[] = [
        { time: "10:21", user: user?.email || "you@example.com", action: "Created restaurant", target: "My Restaurant", status: "ok" },
        { time: "10:03", user: user?.email || "you@example.com", action: "Added menu item", target: "Pizza Margherita", status: "ok" },
        { time: "09:55", user: user?.email || "you@example.com", action: "Uploaded logo", target: "Restaurant Logo", status: "ok" },
        { time: "09:44", user: user?.email || "you@example.com", action: "Created category", target: "Appetizers", status: "ok" },
        { time: "09:12", user: user?.email || "you@example.com", action: "Generated QR code", target: "Menu QR", status: "ok" },
      ]

      setActivity(mockActivity)
      setFilteredActivity(mockActivity)
    } catch (error) {
      showToast(`Failed to load activity: ${error}`, 'warn')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadActivity()])
      setLoading(false)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = activity.filter(a =>
        Object.values(a).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredActivity(filtered)
    } else {
      setFilteredActivity(activity)
    }
  }, [searchQuery, activity])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = () => {
    const header = "time,user,action,target,status\n"
    const rows = activity.map(a => [a.time, a.user, a.action, a.target, a.status].join(',')).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'magicmenu_activity.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Activity data exported successfully!', 'ok')
  }

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([loadStats(), loadActivity()])
    setLoading(false)
    showToast('Data refreshed successfully!', 'ok')
  }

  const performSmartSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false)
      return
    }

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Fallback: Search in localStorage for demo data
        const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
        const matchingRestaurants = demoRestaurants.filter((restaurant: any) =>
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.slug.toLowerCase().includes(query.toLowerCase())
        )
        
        setSearchResults({
          restaurants: matchingRestaurants,
          users: [] // No user data in demo mode
        })
        setShowSearchResults(true)
        return
      }

      // Search restaurants
      const { data: restaurants } = await sb
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${query}%, slug.ilike.%${query}%`)
        .limit(5)

      // Search users (if you have a users table)
      const { data: users } = await sb
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%, email.ilike.%${query}%`)
        .limit(5)

      setSearchResults({
        restaurants: restaurants || [],
        users: users || []
      })
      setShowSearchResults(true)

    } catch (error) {
      console.error('Search error:', error)
      showToast('Search failed. Please try again.', 'warn')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSmartSearch(searchQuery)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Auto-search as user types (with debounce)
    clearTimeout((window as any).searchTimeout)
    ;(window as any).searchTimeout = setTimeout(() => {
      performSmartSearch(value)
    }, 300)
  }

  const navigateToRestaurant = (restaurant: any) => {
    // Navigate to restaurant page or show restaurant details
    window.location.href = `/admin/restaurants`
    showToast(`Navigating to restaurant: ${restaurant.name}`, 'ok')
  }

  const navigateToUser = (user: any) => {
    // Navigate to users page or show user details
    window.location.href = `/admin/users`
    showToast(`Navigating to user: ${user.display_name || user.email}`, 'ok')
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: '#6a5a3d'
      }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '12px' }}>Loading admin dashboard...</span>
      </div>
    )
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
            <Link href="/admin/qr" role="tab" aria-selected="false">
              QR Codes
            </Link>
            <Link href="/admin/users" role="tab" aria-selected="false">
              Users
            </Link>
            <Link href="/admin/reviews" role="tab" aria-selected="false">
              Reviews
            </Link>
          </div>
          <div className="row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <Link href="/auth/login" className="btn small">Sign In</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="head">
          <div>
            <h1 className="title">🏪 Restaurant Management</h1>
            <p className="subtitle">Welcome back! Manage your restaurants and system.</p>
          </div>
          <div className="filters">
            <form onSubmit={handleSearchSubmit} className="search-container" style={{ position: 'relative' }}>
              <div className="input">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search restaurants, users, or activity..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && (searchResults.restaurants.length > 0 || searchResults.users.length > 0) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {searchResults.restaurants.length > 0 && (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Restaurants
                      </div>
                      {searchResults.restaurants.map((restaurant, index) => (
                        <div
                          key={index}
                          onClick={() => navigateToRestaurant(restaurant)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream-1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <span style={{ fontSize: '16px' }}>🏪</span>
                          <div>
                            <div style={{ fontWeight: '600' }}>{restaurant.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>magicmenu.com/r/{restaurant.slug}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.users.length > 0 && (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Users
                      </div>
                      {searchResults.users.map((user, index) => (
                        <div
                          key={index}
                          onClick={() => navigateToUser(user)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream-1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <span style={{ fontSize: '16px' }}>👤</span>
                          <div>
                            <div style={{ fontWeight: '600' }}>{user.display_name || 'Unknown User'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>{user.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
            <button className="btn small" onClick={handleRefresh}>↻ Refresh</button>
          </div>
        </div>

        <section className="metrics">
          <div className="metric ok">
            <div className="label">Restaurants</div>
            <div className="value">{stats?.total_restaurants || 0}</div>
          </div>
          <div className="metric">
            <div className="label">Menu Items</div>
            <div className="value">{stats?.total_menu_items || 0}</div>
          </div>
          <div className="metric warn">
            <div className="label">Categories</div>
            <div className="value">{stats?.total_categories || 0}</div>
          </div>
          <div className="metric bad">
            <div className="label">Reviews</div>
            <div className="value">{stats?.total_reviews || 0}</div>
          </div>
        </section>

        <section className="grid">
          <article className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="head">
              <h3>Recent Activity</h3>
              <div className="actions">
                <button className="btn pill" onClick={handleExportCSV}>Export CSV</button>
              </div>
            </div>
            <div className="body">
              <table aria-label="Recent activity">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((item, index) => (
                    <tr key={index}>
                      <td>{item.time}</td>
                      <td>{item.user}</td>
                      <td>{item.action}</td>
                      <td>{item.target}</td>
                      <td>
                        <span className={`status ${item.status}`}>
                          {item.status === 'ok' ? 'Success' : item.status === 'warn' ? 'Review' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <footer>© MagicMenu Admin</footer>
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