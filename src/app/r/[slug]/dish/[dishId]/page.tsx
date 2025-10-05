'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Price from '@/components/Price'
import '../dish.css'

export default function DishPage({ params }: { params: { slug: string, dishId: string } }) {
  const [dish, setDish] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const loadDishData = async () => {
      try {
        setLoading(true)
        
        // Check user permissions
        const user = JSON.parse(localStorage.getItem('sb-auth-token') || '{}')
        const userEmail = user?.user?.email || ''
        const isAdminUser = userEmail.includes('admin') || userEmail.includes('magicmenu')
        setIsAdmin(isAdminUser)
        
        // First try localStorage for demo data
        if (typeof window !== 'undefined') {
          const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
          const demoMenuItems = JSON.parse(localStorage.getItem('demo_menu_items') || '[]')
          
          const foundRestaurant = demoRestaurants.find((r: any) => r.slug === params.slug)
          const foundDish = demoMenuItems.find((d: any) => d.id === params.dishId)
          
          if (foundRestaurant && foundDish) {
            console.log('Found demo dish:', foundDish)
            setRestaurant(foundRestaurant)
            setDish(foundDish)
            
            // Check if user is restaurant owner
            const isRestaurantOwner = foundRestaurant.owner_user_id === user?.user?.id
            setIsOwner(isRestaurantOwner)
            
            setLoading(false)
            return
          }
        }
        
        // If not found in localStorage, try Supabase
        const sb = supabaseBrowser()
        const { data: restaurantData } = await sb
          .from('restaurants')
          .select('*')
          .eq('slug', params.slug)
          .single()
          
        const { data: dishData } = await sb
          .from('menu_items')
          .select('*')
          .eq('id', params.dishId)
          .single()
          
        if (!restaurantData || !dishData) {
          setError('Dish not found')
          setLoading(false)
          return
        }
        
        setRestaurant(restaurantData)
        setDish(dishData)
        
      } catch (err) {
        console.error('Error loading dish:', err)
        setError('Failed to load dish data')
      } finally {
        setLoading(false)
      }
    }
    
    loadDishData()
  }, [params.slug, params.dishId])

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
        Loading dish...
      </div>
    )
  }

  if (error || !dish || !restaurant) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#dc2626'
      }}>
        {error || 'Dish not found'}
      </div>
    )
  }

  return (
    <div className="dish-page">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href={`/r/${params.slug}`} className="brand">
            <div className="logo">MM</div>
            <div className="brand-name">MagicMenu</div>
          </Link>
          <div className="auth">
            <Link href={`/r/${params.slug}`} className="back">← Back to Menu</Link>
            <a href="#" className="link">Sign In</a>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="grid">
          <figure className="img-card">
            <img 
              className="dish-img" 
              src={dish.image_url || '/placeholder-dish.jpg'} 
              alt={dish.name}
              onClick={() => setImageZoomed(true)}
              style={{ cursor: 'pointer' }}
            />
            <div className="zoom-tip">Click to zoom</div>
          </figure>

          <section>
            <h1 className="title">{dish.name}</h1>
            <div className="price">
              <Price cents={dish.price_cents || 0} code={dish.currency_code || 'USD'} />
            </div>
            <div className="divider"></div>

            <article className="card">
              <div className="head">Description</div>
              <div className="body">{dish.description || 'No description available.'}</div>
            </article>

            <div style={{height: '14px'}}></div>

            {dish.ingredients && (
              <article className="card">
                <div className="head">Ingredients</div>
                <div className="body">
                  <ul className="list">
                    {dish.ingredients.split(',').map((ingredient: string, index: number) => (
                      <li key={index}>{ingredient.trim()}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )}

            <div style={{height: '14px'}}></div>

            {dish.allergens && (
              <article className="card">
                <div className="head">Allergens</div>
                <div className="body">
                  <div className="chips">
                    {dish.allergens.split(',').map((allergen: string, index: number) => (
                      <span key={index} className="chip">
                        {allergen.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            )}

            <div style={{height: '14px'}}></div>

            {dish.nutrition_info && (
              <article className="card">
                <div className="head">Nutrition Information</div>
                <div className="body">
                  <div className="nutri">
                    {Object.entries(dish.nutrition_info).map(([key, value]) => (
                      <div key={key} className="n">
                        <div className="label">{key.replace('_', ' ').toUpperCase()}</div>
                        <div className="val">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )}

            <div className="cta">
              <button className="btn primary">Add to Order</button>
              <button className="btn">Share Dish</button>
              {(isAdmin || isOwner) && (
                <Link 
                  href={`/r/${params.slug}/dish/${params.dishId}/edit`}
                  className="btn"
                  style={{ background: 'linear-gradient(90deg, #d3ad3a, #b8941f)', color: 'white', border: 'none' }}
                >
                  ✏️ Edit Dish
                </Link>
              )}
            </div>
          </section>
        </div>

        <section style={{marginTop: '36px'}}>
          <h2 style={{fontWeight: '800', margin: '0 0 12px'}}>More like this</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px'}}>
            <div className="card">
              <div className="body" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <img 
                  src="/placeholder-dish.jpg" 
                  alt="" 
                  style={{width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)'}}
                />
                <div>
                  <div style={{fontWeight: '800'}}>Garlic Parmesan Wings</div>
                  <div style={{opacity: '.7'}}>From $14</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="body" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <img 
                  src="/placeholder-dish.jpg" 
                  alt="" 
                  style={{width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)'}}
                />
                <div>
                  <div style={{fontWeight: '800'}}>BBQ Wings</div>
                  <div style={{opacity: '.7'}}>From $13</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="body" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <img 
                  src="/placeholder-dish.jpg" 
                  alt="" 
                  style={{width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)'}}
                />
                <div>
                  <div style={{fontWeight: '800'}}>Sweet Chili Wings</div>
                  <div style={{opacity: '.7'}}>From $14</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Image Zoom Modal */}
      <div className={`modal ${imageZoomed ? 'open' : ''}`} id="zoomModal" aria-hidden={!imageZoomed}>
        <button className="close" onClick={() => setImageZoomed(false)}>✕ Close</button>
        <img 
          src={dish.image_url || '/placeholder-dish.jpg'} 
          alt={dish.name}
          onClick={() => setImageZoomed(false)}
        />
      </div>
    </div>
  )
}
