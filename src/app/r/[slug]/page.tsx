'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Price from '@/components/Price'
import './restaurant.css'

export default function RestaurantPage({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        setLoading(true)
        
        // Check user permissions
        const user = JSON.parse(localStorage.getItem('sb-auth-token') || '{}')
        const userEmail = user?.user?.email || ''
        const isAdminUser = userEmail.includes('admin') || userEmail.includes('magicmenu')
        setIsAdmin(isAdminUser)
        
        // First try localStorage for demo restaurants
        if (typeof window !== 'undefined') {
          const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
          const demoRestaurant = demoRestaurants.find((r: any) => r.slug === params.slug)
          
          if (demoRestaurant) {
            console.log('Found demo restaurant:', demoRestaurant)
            setRestaurant(demoRestaurant)
            
            // Check if user is restaurant owner
            const isRestaurantOwner = demoRestaurant.owner_user_id === user?.user?.id
            setIsOwner(isRestaurantOwner)
            
            // Load demo categories and menu items
            const demoCategories = JSON.parse(localStorage.getItem('demo_categories') || '[]')
            const demoMenuItems = JSON.parse(localStorage.getItem('demo_menu_items') || '[]')
            
            const restaurantCategories = demoCategories.filter((c: any) => c.restaurant_id === demoRestaurant.id)
            const restaurantMenuItems = demoMenuItems.filter((i: any) => i.restaurant_id === demoRestaurant.id)
            
            setCategories(restaurantCategories)
            setMenuItems(restaurantMenuItems)
            setLoading(false)
            return
          }
        }
        
        // If not found in localStorage, try Supabase
        const sb = supabaseBrowser()
        const { data: restaurantData, error: restaurantError } = await sb
          .from('restaurants')
          .select('*')
          .eq('slug', params.slug)
          .single()
          
        if (restaurantError || !restaurantData) {
          setError('Restaurant not found')
          setLoading(false)
          return
        }
        
        setRestaurant(restaurantData)
        
        const [{ data: cats }, { data: items }] = await Promise.all([
          sb.from('categories').select('*').eq('restaurant_id', restaurantData.id).order('sort_order'),
          sb.from('menu_items').select('*').eq('restaurant_id', restaurantData.id).eq('is_active', true)
        ])
        
        setCategories(cats || [])
        setMenuItems(items || [])
        
      } catch (err) {
        console.error('Error loading restaurant:', err)
        setError('Failed to load restaurant data')
      } finally {
        setLoading(false)
      }
    }
    
    loadRestaurantData()
  }, [params.slug])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading restaurant...
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#dc2626'
      }}>
        {error || 'Restaurant not found'}
      </div>
    )
  }

  return (
    <div className="restaurant-page">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <div className="logo">MM</div>
            <div className="brand-name">MagicMenu</div>
          </Link>
          <div className="auth">
            <Link href="/" className="back">← Back</Link>
            <a href="#" className="link">Sign In</a>
          </div>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          {restaurant.logo_url && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '20px' 
            }}>
              <Image 
                src={restaurant.logo_url} 
                alt={`${restaurant.name} logo`}
                width={120}
                height={120}
                style={{ 
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          )}
          <h1 className="name">{restaurant.name}</h1>
          <div className="meta">
            <div className="stars">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className="star" style={{opacity: i <= Math.floor(Number(restaurant.avg_rating)) ? 1 : 0.4}}></span>
              ))}
            </div>
            <span>{Number(restaurant.avg_rating).toFixed(1)} • {restaurant.review_count} reviews</span>
            <span className="dot">•</span>
            <div className="tags">
              <span className="tag">Restaurant</span>
              <span className="tag">Food</span>
              <span className="tag">Menu</span>
            </div>
          </div>
        </section>

        {(categories || []).map(c => (
          <section key={c.id} className="section">
            <h2>{c.name}</h2>
            <div className="grid">
              {(menuItems || []).filter(i => i.category_id === c.id).map(i => (
                <div key={i.id} style={{ position: 'relative' }}>
                  <Link href={`/r/${params.slug}/dish/${i.id}`} className="card-link">
                    <article className="card">
                      <div className="thumb">
                        {i.image_url && (
                          <Image 
                            alt={i.name} 
                            src={i.image_url} 
                            fill 
                            className="object-cover" 
                          />
                        )}
                      </div>
                      <div className="body">
                        <h3>{i.name}</h3>
                        <div className="row">
                          <span>{i.description || ''}</span>
                          <span><Price cents={i.price_cents || 0} code={i.currency_code || 'USD'} /></span>
                        </div>
                      </div>
                    </article>
                  </Link>
                  {(isAdmin || isOwner) && (
                    <Link 
                      href={`/r/${params.slug}/dish/${i.id}/edit`}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(211, 173, 58, 0.9)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        zIndex: 10,
                        backdropFilter: 'blur(4px)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✏️ Edit
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <footer style={{textAlign: 'center', padding: '24px', color: 'rgba(106,90,61,.8)'}}>
          © MagicMenu
        </footer>
      </main>
    </div>
  )
}
