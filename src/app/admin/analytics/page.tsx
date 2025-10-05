'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import '../admin.css'

interface AnalyticsData {
  total_views: number
  total_orders: number
  total_revenue: number
  popular_items: Array<{
    name: string
    order_count: number
    revenue: number
  }>
  daily_views: Array<{
    date: string
    views: number
  }>
  daily_orders: Array<{
    date: string
    orders: number
    revenue: number
  }>
  restaurant_stats: Array<{
    restaurant_id: string
    restaurant_name: string
    views: number
    orders: number
    revenue: number
    avg_rating: number
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)

  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAnalytics = async () => {
    if (!user) return

    try {
      // Get user's restaurants first
      const { data: restaurants } = await sb
        .from('restaurants')
        .select('id, name')
        .eq('owner_user_id', user.id)

      if (!restaurants || restaurants.length === 0) {
        setAnalytics(null)
        setLoading(false)
        return
      }

      const restaurantIds = restaurants.map((r: any) => r.id)

      // Calculate date range
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get restaurant views (simulated - in real app, you'd track this)
      const { data: viewsData } = await sb
        .from('restaurant_views')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .gte('created_at', startDate.toISOString())

      // Get orders (simulated - in real app, you'd have an orders table)
      const { data: ordersData } = await sb
        .from('orders')
        .select(`
          *,
          order_items(
            menu_items(name, price_cents)
          )
        `)
        .in('restaurant_id', restaurantIds)
        .gte('created_at', startDate.toISOString())

      // Get reviews for ratings
      const { data: reviewsData } = await sb
        .from('reviews')
        .select('rating, restaurant_id')
        .in('restaurant_id', restaurantIds)

      // Calculate analytics
      const totalViews = viewsData?.length || 0
      const totalOrders = ordersData?.length || 0
      const totalRevenue = ordersData?.reduce((sum: number, order: any) => sum + (order.total_cents || 0), 0) || 0

      // Popular items
      const itemCounts: { [key: string]: { name: string; count: number; revenue: number } } = {}
      ordersData?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const itemName = item.menu_items?.name || 'Unknown Item'
          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { name: itemName, count: 0, revenue: 0 }
          }
          itemCounts[itemName].count += 1
          itemCounts[itemName].revenue += item.menu_items?.price_cents || 0
        })
      })

      const popularItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({ name: item.name, order_count: item.count, revenue: item.revenue }))

      // Daily data (simplified)
      const dailyViews = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return {
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 20) + 5 // Simulated data
        }
      })

      const dailyOrders = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return {
          date: date.toISOString().split('T')[0],
          orders: Math.floor(Math.random() * 10) + 1, // Simulated data
          revenue: Math.floor(Math.random() * 500) + 100 // Simulated data
        }
      })

      // Restaurant stats
      const restaurantStats = restaurants.map((restaurant: any) => {
        const restaurantViews = viewsData?.filter((v: any) => v.restaurant_id === restaurant.id).length || 0
        const restaurantOrders = ordersData?.filter((o: any) => o.restaurant_id === restaurant.id).length || 0
        const restaurantRevenue = ordersData?.filter((o: any) => o.restaurant_id === restaurant.id)
          .reduce((sum: number, order: any) => sum + (order.total_cents || 0), 0) || 0
        const restaurantReviews = reviewsData?.filter((r: any) => r.restaurant_id === restaurant.id) || []
        const avgRating = restaurantReviews.length > 0 
          ? restaurantReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / restaurantReviews.length 
          : 0

        return {
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          views: restaurantViews,
          orders: restaurantOrders,
          revenue: restaurantRevenue,
          avg_rating: avgRating
        }
      })

      setAnalytics({
        total_views: totalViews,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        popular_items: popularItems,
        daily_views: dailyViews,
        daily_orders: dailyOrders,
        restaurant_stats: restaurantStats
      })

    } catch (error) {
      showToast(`Failed to load analytics: ${error}`, 'warn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [user, selectedPeriod])

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#fbbf24' : '#d1d5db' }}>
        ★
      </span>
    ))
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
            <Link href="/admin/analytics" className="active" role="tab" aria-selected="true">
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
                  onClick={async () => {
                    await sb.auth.signOut()
                    window.location.href = '/'
                  }}
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
        <h1 className="h1">📊 Analytics Dashboard</h1>
        <p className="lead">Track your restaurant performance and customer insights.</p>

        <div className="pills">
          <div 
            className={`pill ${selectedPeriod === '7d' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('7d')}
          >
            Last 7 Days
          </div>
          <div 
            className={`pill ${selectedPeriod === '30d' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('30d')}
          >
            Last 30 Days
          </div>
          <div 
            className={`pill ${selectedPeriod === '90d' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('90d')}
          >
            Last 90 Days
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : !analytics ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3>No Analytics Data</h3>
            <p>Analytics data will appear once you have restaurants and customer activity.</p>
          </div>
        ) : (
          <div className="grid">
            {/* Overview Stats */}
            <section className="card">
              <div className="head">
                <h2>📈 Overview</h2>
              </div>
              <div className="body">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{analytics.total_views}</div>
                    <div className="stat-label">Total Views</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{analytics.total_orders}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{formatCurrency(analytics.total_revenue)}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {analytics.total_orders > 0 ? (analytics.total_revenue / analytics.total_orders / 100).toFixed(2) : '0.00'}
                    </div>
                    <div className="stat-label">Avg Order Value</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Popular Items */}
            <section className="card">
              <div className="head">
                <h2>🍕 Popular Items</h2>
              </div>
              <div className="body">
                {analytics.popular_items.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    No order data available yet
                  </p>
                ) : (
                  <div className="popular-items">
                    {analytics.popular_items.map((item, index) => (
                      <div key={index} className="popular-item">
                        <div className="item-rank">#{index + 1}</div>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-stats">
                            {item.order_count} orders • {formatCurrency(item.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Restaurant Performance */}
            <section className="card">
              <div className="head">
                <h2>🏪 Restaurant Performance</h2>
              </div>
              <div className="body">
                <div className="restaurant-performance">
                  {analytics.restaurant_stats.map((restaurant) => (
                    <div key={restaurant.restaurant_id} className="restaurant-stat">
                      <div className="restaurant-header">
                        <h4>{restaurant.restaurant_name}</h4>
                        <div className="restaurant-rating">
                          {renderStars(restaurant.avg_rating)}
                          <span>({restaurant.avg_rating.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="restaurant-metrics">
                        <div className="metric">
                          <span className="metric-value">{restaurant.views}</span>
                          <span className="metric-label">Views</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{restaurant.orders}</span>
                          <span className="metric-label">Orders</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{formatCurrency(restaurant.revenue)}</span>
                          <span className="metric-label">Revenue</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Daily Trends */}
            <section className="card">
              <div className="head">
                <h2>📅 Daily Trends</h2>
              </div>
              <div className="body">
                <div className="trends-container">
                  <div className="trend-chart">
                    <h4>Views Over Time</h4>
                    <div className="chart-bars">
                      {analytics.daily_views.slice(-7).map((day, index) => (
                        <div key={index} className="chart-bar">
                          <div 
                            className="bar-fill"
                            style={{ 
                              height: `${Math.max(10, (day.views / Math.max(...analytics.daily_views.map(d => d.views))) * 100)}%` 
                            }}
                          ></div>
                          <div className="bar-label">
                            {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="bar-value">{day.views}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

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
