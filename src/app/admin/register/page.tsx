'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import '../admin.css'

interface RestaurantForm {
  name: string
  description: string
  phone: string
  address: string
  slug: string
  logo?: File
}

export default function RegisterRestaurantPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<RestaurantForm>({
    name: '',
    description: '',
    phone: '',
    address: '',
    slug: '',
    logo: undefined
  })
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'demo'>('card')
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: ''
  })
  const [paymentMethodAdded, setPaymentMethodAdded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const sb = supabaseBrowser()

  // Check if user is admin
  useEffect(() => {
    const superAdminEmails = [
      'admin@magicmenu.com',
      'owner@magicmenu.com',
      'ron.degtyar@gmail.com'
    ]
    
    const userIsAdmin = user?.email && superAdminEmails.includes(user.email)
    setIsAdmin(!!userIsAdmin)
    
    // If admin, automatically set payment as completed
    if (userIsAdmin) {
      setPaymentMethodAdded(true)
      setPaymentMethod('demo') // Admin uses demo mode (free)
    }
  }, [user])

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  const createDemoMenuData = (restaurantId: string, restaurantName: string) => {
    // Create demo categories
    const demoCategories = [
      {
        id: `cat-${restaurantId}-1`,
        restaurant_id: restaurantId,
        name: 'Appetizers',
        sort_order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: `cat-${restaurantId}-2`,
        restaurant_id: restaurantId,
        name: 'Main Courses',
        sort_order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: `cat-${restaurantId}-3`,
        restaurant_id: restaurantId,
        name: 'Desserts',
        sort_order: 3,
        created_at: new Date().toISOString()
      }
    ]

    // Create demo menu items with detailed information
    const demoMenuItems = [
      {
        id: `item-${restaurantId}-1`,
        restaurant_id: restaurantId,
        category_id: `cat-${restaurantId}-1`,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan cheese and croutons',
        price_cents: 1200,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Romaine lettuce, Parmesan cheese, Croutons, Caesar dressing, Lemon juice',
        allergens: 'Dairy, Gluten, Eggs',
        nutrition_info: {
          calories: 320,
          protein: '12g',
          carbs: '18g',
          fat: '22g',
          fiber: '4g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: `item-${restaurantId}-2`,
        restaurant_id: restaurantId,
        category_id: `cat-${restaurantId}-1`,
        name: 'Buffalo Wings',
        description: 'Spicy chicken wings with blue cheese dip',
        price_cents: 1500,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Chicken wings, Buffalo sauce, Blue cheese, Celery, Ranch dressing',
        allergens: 'Dairy, Gluten',
        nutrition_info: {
          calories: 450,
          protein: '28g',
          carbs: '8g',
          fat: '32g',
          fiber: '2g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: `item-${restaurantId}-3`,
        restaurant_id: restaurantId,
        category_id: `cat-${restaurantId}-2`,
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon herb butter',
        price_cents: 2800,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Atlantic salmon, Lemon, Herbs, Butter, Olive oil, Salt, Pepper',
        allergens: 'Fish, Dairy',
        nutrition_info: {
          calories: 380,
          protein: '35g',
          carbs: '2g',
          fat: '24g',
          fiber: '0g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: `item-${restaurantId}-4`,
        restaurant_id: restaurantId,
        category_id: `cat-${restaurantId}-2`,
        name: 'Beef Steak',
        description: 'Premium ribeye steak cooked to perfection',
        price_cents: 3500,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Ribeye steak, Salt, Black pepper, Garlic, Rosemary, Olive oil',
        allergens: 'None',
        nutrition_info: {
          calories: 520,
          protein: '42g',
          carbs: '0g',
          fat: '38g',
          fiber: '0g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: `item-${restaurantId}-5`,
        restaurant_id: restaurantId,
        category_id: `cat-${restaurantId}-3`,
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with vanilla ice cream',
        price_cents: 800,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Chocolate, Flour, Sugar, Eggs, Butter, Vanilla ice cream, Cocoa powder',
        allergens: 'Dairy, Eggs, Gluten',
        nutrition_info: {
          calories: 420,
          protein: '6g',
          carbs: '52g',
          fat: '22g',
          fiber: '3g'
        },
        created_at: new Date().toISOString()
      }
    ]

    // Store in localStorage
    const existingCategories = JSON.parse(localStorage.getItem('demo_categories') || '[]')
    const existingMenuItems = JSON.parse(localStorage.getItem('demo_menu_items') || '[]')
    
    existingCategories.push(...demoCategories)
    existingMenuItems.push(...demoMenuItems)
    
    localStorage.setItem('demo_categories', JSON.stringify(existingCategories))
    localStorage.setItem('demo_menu_items', JSON.stringify(existingMenuItems))
    
    console.log(`Created demo menu data for ${restaurantName}`)
  }

  const createDemoReviews = (restaurantId: string, restaurantName: string) => {
    const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
    const sampleUsers = demoUsers.slice(0, 3) // Get first 3 users for reviews
    
    const demoReviews = [
      {
        id: `review-${restaurantId}-1`,
        restaurant_id: restaurantId,
        user_id: sampleUsers[0]?.id || 'demo-user-1',
        rating: 5,
        comment: `Amazing food at ${restaurantName}! The service was excellent and the atmosphere was perfect. Highly recommend!`,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `review-${restaurantId}-2`,
        restaurant_id: restaurantId,
        user_id: sampleUsers[1]?.id || 'demo-user-2',
        rating: 4,
        comment: `Great experience at ${restaurantName}. The food was delicious and the staff was very friendly. Will definitely come back!`,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `review-${restaurantId}-3`,
        restaurant_id: restaurantId,
        user_id: sampleUsers[2]?.id || 'demo-user-3',
        rating: 3,
        comment: `Decent food at ${restaurantName}. The service was okay but could be improved. The ambiance was nice though.`,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Store in localStorage
    const existingReviews = JSON.parse(localStorage.getItem('demo_reviews') || '[]')
    existingReviews.push(...demoReviews)
    localStorage.setItem('demo_reviews', JSON.stringify(existingReviews))

    console.log(`Created demo reviews for ${restaurantName}`)
  }

  const generateQRForRestaurant = async (restaurantId: string, restaurantSlug: string) => {
    try {
      // Generate QR code URL
      const baseUrl = window.location.origin
      const menuUrl = `${baseUrl}/r/${restaurantSlug}?src=qr`
      
      // For demo purposes, create a simple QR code data URL
      // In a real app, you'd call the QR generation API
      const qrDataUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
            QR Code for ${restaurantSlug}
          </text>
        </svg>
      `)}`
      
      // Update restaurant with QR code
      const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
      const updatedRestaurants = demoRestaurants.map((r: any) => 
        r.id === restaurantId 
          ? { ...r, qr_url: qrDataUrl }
          : r
      )
      localStorage.setItem('demo_restaurants', JSON.stringify(updatedRestaurants))
      
      console.log(`Generated QR code for ${restaurantSlug}`)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm(prev => ({
        ...prev,
        logo: file
      }))
    }
  }

  const handlePaymentDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validatePaymentMethod = () => {
    if (paymentMethod === 'demo') {
      setPaymentMethodAdded(true)
      showToast('Demo payment method added successfully!', 'ok')
      return true
    }

    const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName', 'billingAddress', 'city', 'state', 'zipCode']
    const missingFields = requiredFields.filter(field => !paymentDetails[field as keyof typeof paymentDetails])
    
    if (missingFields.length > 0) {
      showToast('Please fill in all payment details', 'warn')
      return false
    }

    // Basic card number validation (should be 16 digits)
    if (paymentDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      showToast('Please enter a valid 16-digit card number', 'warn')
      return false
    }

    // Basic CVV validation (should be 3-4 digits)
    if (paymentDetails.cvv.length < 3 || paymentDetails.cvv.length > 4) {
      showToast('Please enter a valid CVV (3-4 digits)', 'warn')
      return false
    }

    setPaymentMethodAdded(true)
    showToast('Payment method added successfully!', 'ok')
    return true
  }

  const processPayment = async () => {
    setPaymentProcessing(true)
    
    try {
      if (paymentMethod === 'demo') {
        // Simulate payment processing for demo
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { success: true, transactionId: `demo_${Date.now()}` }
      } else {
        // Simulate $50 payment processing
        showToast('Processing $50 payment...', 'ok')
        await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate payment processing
        
        // In a real implementation, integrate with Stripe or other payment processor
        // For now, simulate successful payment
        return { success: true, transactionId: `stripe_${Date.now()}` }
      }
    } catch (error) {
      showToast('Payment failed. Please try again.', 'warn')
      return { success: false }
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.description || !form.phone || !form.address) {
      showToast('Please fill in all required fields', 'warn')
      return
    }

    if (!form.slug) {
      showToast('Please enter a valid restaurant name to generate a URL slug', 'warn')
      return
    }

    if (!paymentMethodAdded) {
      showToast('Please add a payment method before registering your restaurant', 'warn')
      return
    }

    setUploading(true)

    // Add timeout to prevent getting stuck
    const timeoutId = setTimeout(() => {
      setUploading(false)
      showToast('Registration timed out. Please try again.', 'warn')
    }, 15000) // 15 second timeout (increased for payment processing)

    try {
      // Process payment first (skip for admins)
      let paymentResult = null
      if (!isAdmin) {
        console.log('Processing payment...')
        paymentResult = await processPayment()
        
        if (!paymentResult.success) {
          showToast('Payment failed. Registration cancelled.', 'warn')
          clearTimeout(timeoutId)
          setUploading(false)
          return
        }
      } else {
        console.log('Admin registration - skipping payment')
      }

      // Always try localStorage first for demo purposes
      console.log('Creating restaurant in demo mode...')
      
      // Simulate a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const restaurant = {
        id: `demo-${Date.now()}`,
        name: form.name,
        description: form.description,
        phone: form.phone,
        address: form.address,
        slug: form.slug,
        owner_user_id: user?.id || null,
        avg_rating: 0,
        review_count: 0,
        created_at: new Date().toISOString(),
        logo_url: form.logo ? URL.createObjectURL(form.logo) : null,
        payment_status: isAdmin ? 'admin_free' : 'paid',
        payment_amount: isAdmin ? 0 : 50,
        payment_method: isAdmin ? 'admin' : paymentMethod,
        transaction_id: isAdmin ? 'admin_free' : (paymentResult?.transactionId || 'demo_payment')
      }

      // Store in localStorage for demo
      const existingRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
      
      // Check if slug already exists in localStorage
      const slugExists = existingRestaurants.some((r: any) => r.slug === form.slug)
      if (slugExists) {
        showToast('A restaurant with this name already exists. Please choose a different name.', 'warn')
        clearTimeout(timeoutId)
        setUploading(false)
        return
      }

      existingRestaurants.push(restaurant)
      localStorage.setItem('demo_restaurants', JSON.stringify(existingRestaurants))
      
      // Create demo categories and menu items for the new restaurant
      createDemoMenuData(restaurant.id, restaurant.name)
      
      // Create demo reviews for the new restaurant
      createDemoReviews(restaurant.id, restaurant.name)
      
      // Generate QR code for the new restaurant
      generateQRForRestaurant(restaurant.id, restaurant.slug)

      setCreatedRestaurant(restaurant)
      showToast(isAdmin 
        ? 'Restaurant added successfully! (Admin registration - stored locally)' 
        : 'Restaurant created successfully! (Demo mode - stored locally)'
      )
      
      // Reset form
      setForm({
        name: '',
        description: '',
        phone: '',
        address: '',
        slug: '',
        logo: undefined
      })

      clearTimeout(timeoutId)

    } catch (error) {
      console.error('Registration error:', error)
      showToast(`Failed to create restaurant: ${error}`, 'warn')
      clearTimeout(timeoutId)
    } finally {
      setUploading(false)
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
                   <Link href="/admin/restaurants" role="tab" aria-selected="false">
                     My Restaurants
                   </Link>
                   <Link href="/admin/analytics" role="tab" aria-selected="false">
                     Analytics
                   </Link>
                   <Link href="/admin/qr" role="tab" aria-selected="false">
                     QR Codes
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
                     console.log('Sign out button clicked')
                     
                     // Clear all data first
                     localStorage.clear()
                     sessionStorage.clear()
                     
                     // Clear cookies
                     document.cookie.split(";").forEach(function(c) { 
                       document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                     });
                     
                     // Try Supabase sign out
                     try {
                       const sb = supabaseBrowser()
                       await sb.auth.signOut()
                       console.log('Supabase sign out successful')
                     } catch (error) {
                       console.error('Supabase sign out failed:', error)
                     }
                     
                     // Force redirect
                     window.location.replace('/')
                   }}
                   className="btn small"
                   style={{ 
                     cursor: 'pointer',
                     background: '#dc2626',
                     color: 'white',
                     border: '1px solid #dc2626'
                   }}
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
        <h1 className="h1">🏪 Add Restaurant</h1>
        <p className="lead">Add a new restaurant to the MagicMenu system.</p>

        {!isAdmin && (
          <div className="pills">
            <div className="pill active" style={{ background: '#dc2626', color: 'white', fontWeight: 'bold' }}>💰 $50 Registration Fee Required</div>
            <div className="pill">Professional setup</div>
            <div className="pill">Instant QR codes</div>
          </div>
        )}
        
        

        <div className="grid">
          <section className="card">
            <div className="head"><h2>🏪 Restaurant Information</h2></div>
            <div className="body">
              <form onSubmit={handleSubmit}>
                <label htmlFor="name">Restaurant Name *</label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Bella Italia"
                  required
                />

                <label htmlFor="slug">URL Slug (auto-generated)</label>
                <input
                  type="text"
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="bella-italia"
                  style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                />
                <div className="hint">Your restaurant will be available at: magicmenu.com/r/{form.slug || 'your-restaurant'}</div>

                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell customers about your restaurant, cuisine, and specialties..."
                  rows={4}
                  required
                />

                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1-555-0123"
                  required
                />

                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street, City, State 12345"
                  required
                />

                <label htmlFor="logo">Restaurant Logo (Optional)</label>
                <div className="drop">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  <div className="desc">
                    <div>Upload your restaurant logo</div>
                    <div className="dim">PNG, JPG up to 2MB</div>
                  </div>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo" className="btn small">Choose File</label>
                </div>
                {form.logo && (
                  <div className="preview">
                    <div className="thumb">
                      <img 
                        src={URL.createObjectURL(form.logo)} 
                        alt="Logo preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {form.logo.name}
                    </div>
                  </div>
                )}


                {/* Payment Method Section - Only show for non-admins */}
                {!isAdmin && (
                <div style={{ 
                  marginTop: '32px', 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', 
                  borderRadius: '12px', 
                  border: '2px solid #3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '18px', 
                    color: '#1e40af', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    💳 Add Payment Method
                  </h4>
                  
                  {!paymentMethodAdded ? (
                    <div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px',
                        marginBottom: '20px'
                      }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            Card Number *
                          </label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={paymentDetails.cardNumber}
                            onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={paymentDetails.expiryDate}
                            onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            CVV *
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            value={paymentDetails.cvv}
                            onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={paymentDetails.cardholderName}
                            onChange={(e) => handlePaymentDetailsChange('cardholderName', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            Billing Address *
                          </label>
                          <input
                            type="text"
                            placeholder="123 Main Street"
                            value={paymentDetails.billingAddress}
                            onChange={(e) => handlePaymentDetailsChange('billingAddress', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            City *
                          </label>
                          <input
                            type="text"
                            placeholder="New York"
                            value={paymentDetails.city}
                            onChange={(e) => handlePaymentDetailsChange('city', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            State *
                          </label>
                          <input
                            type="text"
                            placeholder="NY"
                            value={paymentDetails.state}
                            onChange={(e) => handlePaymentDetailsChange('state', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            placeholder="10001"
                            value={paymentDetails.zipCode}
                            onChange={(e) => handlePaymentDetailsChange('zipCode', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center',
                        marginTop: '20px'
                      }}>
                        <button
                          type="button"
                          onClick={validatePaymentMethod}
                          className="btn"
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: '1px solid #3b82f6'
                          }}
                        >
                          Add Payment Method
                        </button>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          Required to complete registration
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '16px', 
                      background: '#dcfce7', 
                      border: '1px solid #16a34a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#166534' }}>
                          Payment Method Added Successfully
                        </div>
                        <div style={{ fontSize: '14px', color: '#16a34a' }}>
                          You can now proceed with restaurant registration
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}

                <div className="row" style={{ marginTop: '20px' }}>
                  <button 
                    type="submit" 
                    className="btn primary"
                    disabled={uploading || paymentProcessing || (!isAdmin && !paymentMethodAdded)}
                    style={{ 
                      opacity: (uploading || paymentProcessing || (!isAdmin && !paymentMethodAdded)) ? 0.7 : 1,
                      cursor: (uploading || paymentProcessing || (!isAdmin && !paymentMethodAdded)) ? 'not-allowed' : 'pointer',
                      background: isAdmin ? '#10b981' : '#dc2626',
                      borderColor: isAdmin ? '#10b981' : '#dc2626'
                    }}
                  >
                    {isAdmin ? (
                      uploading ? 'Creating Restaurant...' : 'Add Restaurant (Free)'
                    ) : (
                      !paymentMethodAdded ? 'Add Payment Method First' :
                      paymentProcessing ? 'Processing $50 Payment...' : 
                      uploading ? 'Creating Restaurant...' : 
                      'Pay $50 & Register Restaurant'
                    )}
                  </button>
                  <span className="hint" style={{ color: isAdmin ? '#10b981' : '#dc2626', fontWeight: '600' }}>
                    {isAdmin ? '🆓 Admin registration • No payment required' : 
                     !paymentMethodAdded ? '💳 Payment method required' : '💳 Payment required • $50 one-time fee'}
                  </span>
                </div>
                
                {uploading && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 12px', 
                    background: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#0369a1'
                  }}>
                    ⏳ Processing your restaurant registration...
                  </div>
                )}
              </form>
            </div>
          </section>

          {createdRestaurant && (
            <section className="card">
              <div className="head"><h2>🎉 {isAdmin ? 'Restaurant Added!' : 'Restaurant Created!'}</h2></div>
              <div className="body">
                <div style={{ marginBottom: '16px' }}>
                  <strong>Restaurant:</strong> {createdRestaurant.name}<br/>
                  <strong>URL:</strong> <code>magicmenu.com/r/{createdRestaurant.slug}</code><br/>
                  <strong>ID:</strong> <code>{createdRestaurant.id}</code>
                  {form.logo && (
                    <>
                      <br/><strong>Logo:</strong> {form.logo.name}
                    </>
                  )}
                  <br/><strong>Payment:</strong> {isAdmin ? '🆓 Free (Admin)' : (createdRestaurant.payment_status === 'paid' ? '✅ Paid' : '❌ Pending')}
                  <br/><strong>Amount:</strong> {isAdmin ? '$0' : `$${createdRestaurant.payment_amount}`}
                  <br/><strong>Method:</strong> {isAdmin ? 'Admin Registration' : (createdRestaurant.payment_method === 'demo' ? 'Demo Mode' : 'Credit Card')}
                </div>
                
                <div className="row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/admin/logos" className="btn">
                    📸 Upload Logo
                  </Link>
                  <Link href="/admin/dishes" className="btn">
                    🍕 Add Menu Items
                  </Link>
                  <Link href={`/r/${createdRestaurant.slug}`} className="btn primary">
                    👀 View Restaurant
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>📋 What Happens Next?</h3>
          <ol>
            <li><strong>Payment Processed:</strong> $50 registration fee (or demo mode)</li>
            <li><strong>Restaurant Created:</strong> Your restaurant is now in the system</li>
            <li><strong>Upload Logo:</strong> Add your restaurant's logo image</li>
            <li><strong>Add Menu Items:</strong> Create your digital menu with photos</li>
            <li><strong>Generate QR Code:</strong> Get QR codes for your tables</li>
            <li><strong>Start Serving:</strong> Customers can scan and view your menu!</li>
          </ol>
          
          <div style={{ marginTop: '16px', padding: '12px', background: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
            <strong>💡 Customer Access:</strong> Customers can view your menu without signing in - just scan the QR code!
          </div>
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
