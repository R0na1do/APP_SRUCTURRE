'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Price from '@/components/Price'
import '../dish.css'

interface DishForm {
  name: string
  description: string
  price_cents: number
  currency_code: string
  ingredients: string
  allergens: string
  nutrition_info: {
    calories: number
    protein: string
    carbs: string
    fat: string
    fiber: string
  }
  image_url: string
}

export default function EditDishPage({ params }: { params: { slug: string, dishId: string } }) {
  const router = useRouter()
  const [dish, setDish] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const [form, setForm] = useState<DishForm>({
    name: '',
    description: '',
    price_cents: 0,
    currency_code: 'USD',
    ingredients: '',
    allergens: '',
    nutrition_info: {
      calories: 0,
      protein: '0g',
      carbs: '0g',
      fat: '0g',
      fiber: '0g'
    },
    image_url: ''
  })

  useEffect(() => {
    const loadDishData = async () => {
      try {
        setLoading(true)
        
        // Check if user is admin
        const user = JSON.parse(localStorage.getItem('sb-auth-token') || '{}')
        const userEmail = user?.user?.email || ''
        setIsAdmin(userEmail.includes('admin') || userEmail.includes('magicmenu'))
        
        // Load dish data from localStorage
        if (typeof window !== 'undefined') {
          const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
          const demoMenuItems = JSON.parse(localStorage.getItem('demo_menu_items') || '[]')
          
          const foundRestaurant = demoRestaurants.find((r: any) => r.slug === params.slug)
          const foundDish = demoMenuItems.find((d: any) => d.id === params.dishId)
          
          if (foundRestaurant && foundDish) {
            setRestaurant(foundRestaurant)
            setDish(foundDish)
            
            // Populate form with existing data
            setForm({
              name: foundDish.name || '',
              description: foundDish.description || '',
              price_cents: foundDish.price_cents || 0,
              currency_code: foundDish.currency_code || 'USD',
              ingredients: foundDish.ingredients || '',
              allergens: foundDish.allergens || '',
              nutrition_info: foundDish.nutrition_info || {
                calories: 0,
                protein: '0g',
                carbs: '0g',
                fat: '0g',
                fiber: '0g'
              },
              image_url: foundDish.image_url || ''
            })
            
            setImagePreview(foundDish.image_url || '')
            setLoading(false)
            return
          }
        }
        
        setError('Dish not found')
        setLoading(false)
        
      } catch (err) {
        console.error('Error loading dish:', err)
        setError('Failed to load dish data')
        setLoading(false)
      }
    }
    
    loadDishData()
  }, [params.slug, params.dishId])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setForm(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Update dish in localStorage
      const demoMenuItems = JSON.parse(localStorage.getItem('demo_menu_items') || '[]')
      const updatedItems = demoMenuItems.map((item: any) => {
        if (item.id === params.dishId) {
          return {
            ...item,
            name: form.name,
            description: form.description,
            price_cents: form.price_cents,
            currency_code: form.currency_code,
            ingredients: form.ingredients,
            allergens: form.allergens,
            nutrition_info: form.nutrition_info,
            image_url: imagePreview,
            updated_at: new Date().toISOString()
          }
        }
        return item
      })
      
      localStorage.setItem('demo_menu_items', JSON.stringify(updatedItems))
      
      // Show success message
      alert('Dish updated successfully!')
      
      // Redirect back to dish page
      router.push(`/r/${params.slug}/dish/${params.dishId}`)
      
    } catch (error) {
      console.error('Error updating dish:', error)
      alert('Failed to update dish. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
          <Link href={`/r/${params.slug}/dish/${params.dishId}`} className="brand">
            <div className="logo">MM</div>
            <div className="brand-name">MagicMenu</div>
          </Link>
          <div className="auth">
            <Link href={`/r/${params.slug}/dish/${params.dishId}`} className="back">← Back to Dish</Link>
            <a href="#" className="link">Sign In</a>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: '"Cherry Cream Soda", cursive', fontSize: '2.5rem', margin: '0 0 10px' }}>
            Edit Dish
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {isAdmin ? 'Admin editing' : 'Restaurant owner editing'} - {dish.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Left Column - Image */}
            <div>
              <label style={{ display: 'block', fontWeight: '800', marginBottom: '8px' }}>
                Dish Image
              </label>
              <div className="img-card" style={{ height: '300px' }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Dish preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #f7edd4, #ecd7a5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    No image selected
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginTop: '10px', width: '100%' }}
              />
            </div>

            {/* Right Column - Basic Info */}
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '5px' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '5px' }}>
                  Price (cents) *
                </label>
                <input
                  type="number"
                  value={form.price_cents}
                  onChange={(e) => handleInputChange('price_cents', parseInt(e.target.value) || 0)}
                  required
                  min="0"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  Current: <Price cents={form.price_cents} code={form.currency_code} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '5px' }}>
                  Currency
                </label>
                <select
                  value={form.currency_code}
                  onChange={(e) => handleInputChange('currency_code', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="head">Description</div>
            <div className="body">
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your dish..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="head">Ingredients</div>
            <div className="body">
              <textarea
                value={form.ingredients}
                onChange={(e) => handleInputChange('ingredients', e.target.value)}
                placeholder="List ingredients separated by commas..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Separate ingredients with commas (e.g., "Chicken, Rice, Vegetables")
              </div>
            </div>
          </div>

          {/* Allergens */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="head">Allergens</div>
            <div className="body">
              <textarea
                value={form.allergens}
                onChange={(e) => handleInputChange('allergens', e.target.value)}
                placeholder="List allergens separated by commas..."
                rows={2}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Common allergens: Dairy, Gluten, Nuts, Eggs, Fish, Shellfish, Soy
              </div>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="head">Nutrition Information</div>
            <div className="body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Calories</label>
                  <input
                    type="number"
                    value={form.nutrition_info.calories}
                    onChange={(e) => handleInputChange('nutrition_info.calories', parseInt(e.target.value) || 0)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Protein</label>
                  <input
                    type="text"
                    value={form.nutrition_info.protein}
                    onChange={(e) => handleInputChange('nutrition_info.protein', e.target.value)}
                    placeholder="e.g., 25g"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Carbs</label>
                  <input
                    type="text"
                    value={form.nutrition_info.carbs}
                    onChange={(e) => handleInputChange('nutrition_info.carbs', e.target.value)}
                    placeholder="e.g., 15g"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Fat</label>
                  <input
                    type="text"
                    value={form.nutrition_info.fat}
                    onChange={(e) => handleInputChange('nutrition_info.fat', e.target.value)}
                    placeholder="e.g., 12g"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Fiber</label>
                  <input
                    type="text"
                    value={form.nutrition_info.fiber}
                    onChange={(e) => handleInputChange('nutrition_info.fiber', e.target.value)}
                    placeholder="e.g., 3g"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cta">
            <button 
              type="submit" 
              className="btn primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link 
              href={`/r/${params.slug}/dish/${params.dishId}`}
              className="btn"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
