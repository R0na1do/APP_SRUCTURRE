'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CreateDemoDataPage() {
  const [created, setCreated] = useState(false)

  const createDemoData = () => {
    // Create demo restaurants
    const demoRestaurants = [
      {
        id: 'demo-restaurant-1',
        name: 'Tokyo Sushi Bar',
        description: 'Authentic Japanese cuisine with fresh sushi and sashimi',
        phone: '+1 (555) 123-4567',
        address: '123 Main Street, Tokyo, JP',
        slug: 'tokyo-sushi-bar',
        owner_user_id: 'demo-user-1',
        avg_rating: 4.5,
        review_count: 2,
        created_at: new Date().toISOString(),
        logo_url: '/placeholder-dish.jpg'
      },
      {
        id: 'demo-restaurant-2',
        name: 'Bella Italia',
        description: 'Traditional Italian dishes with homemade pasta',
        phone: '+1 (555) 234-5678',
        address: '456 Oak Avenue, Rome, IT',
        slug: 'bella-italia',
        owner_user_id: 'demo-user-2',
        avg_rating: 4.2,
        review_count: 5,
        created_at: new Date().toISOString(),
        logo_url: '/placeholder-dish.jpg'
      }
    ]

    // Create demo categories
    const demoCategories = [
      // Tokyo Sushi Bar categories
      {
        id: 'cat-demo-restaurant-1-1',
        restaurant_id: 'demo-restaurant-1',
        name: 'Sushi Rolls',
        sort_order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat-demo-restaurant-1-2',
        restaurant_id: 'demo-restaurant-1',
        name: 'Sashimi',
        sort_order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat-demo-restaurant-1-3',
        restaurant_id: 'demo-restaurant-1',
        name: 'Hot Dishes',
        sort_order: 3,
        created_at: new Date().toISOString()
      },
      // Bella Italia categories
      {
        id: 'cat-demo-restaurant-2-1',
        restaurant_id: 'demo-restaurant-2',
        name: 'Appetizers',
        sort_order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat-demo-restaurant-2-2',
        restaurant_id: 'demo-restaurant-2',
        name: 'Pasta',
        sort_order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat-demo-restaurant-2-3',
        restaurant_id: 'demo-restaurant-2',
        name: 'Desserts',
        sort_order: 3,
        created_at: new Date().toISOString()
      }
    ]

    // Create demo menu items with detailed information
    const demoMenuItems = [
      // Tokyo Sushi Bar items
      {
        id: 'item-demo-restaurant-1-1',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-demo-restaurant-1-1',
        name: 'California Roll',
        description: 'Crab, avocado, and cucumber',
        price_cents: 1400,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Crab meat, Avocado, Cucumber, Sushi rice, Nori seaweed, Sesame seeds',
        allergens: 'Shellfish, Sesame',
        nutrition_info: {
          calories: 280,
          protein: '8g',
          carbs: '35g',
          fat: '12g',
          fiber: '3g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'item-demo-restaurant-1-2',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-demo-restaurant-1-1',
        name: 'Spicy Tuna Roll',
        description: 'Fresh tuna with spicy mayo',
        price_cents: 1600,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Fresh tuna, Spicy mayo, Sushi rice, Nori seaweed, Scallions',
        allergens: 'Fish, Eggs',
        nutrition_info: {
          calories: 320,
          protein: '15g',
          carbs: '38g',
          fat: '14g',
          fiber: '2g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'item-demo-restaurant-1-3',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-demo-restaurant-1-2',
        name: 'Salmon Sashimi',
        description: 'Fresh Atlantic salmon sashimi',
        price_cents: 1800,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Fresh Atlantic salmon, Wasabi, Pickled ginger, Soy sauce',
        allergens: 'Fish',
        nutrition_info: {
          calories: 180,
          protein: '22g',
          carbs: '2g',
          fat: '8g',
          fiber: '0g'
        },
        created_at: new Date().toISOString()
      },
      // Bella Italia items
      {
        id: 'item-demo-restaurant-2-1',
        restaurant_id: 'demo-restaurant-2',
        category_id: 'cat-demo-restaurant-2-1',
        name: 'Bruschetta',
        description: 'Toasted bread with tomatoes and basil',
        price_cents: 1200,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Italian bread, Fresh tomatoes, Basil, Garlic, Olive oil, Balsamic vinegar',
        allergens: 'Gluten',
        nutrition_info: {
          calories: 220,
          protein: '6g',
          carbs: '28g',
          fat: '10g',
          fiber: '2g'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'item-demo-restaurant-2-2',
        restaurant_id: 'demo-restaurant-2',
        category_id: 'cat-demo-restaurant-2-2',
        name: 'Spaghetti Carbonara',
        description: 'Classic Roman pasta with eggs and pancetta',
        price_cents: 2200,
        currency_code: 'USD',
        is_active: true,
        image_url: '/placeholder-dish.jpg',
        ingredients: 'Spaghetti pasta, Eggs, Pancetta, Parmesan cheese, Black pepper, Olive oil',
        allergens: 'Gluten, Dairy, Eggs',
        nutrition_info: {
          calories: 480,
          protein: '18g',
          carbs: '45g',
          fat: '24g',
          fiber: '2g'
        },
        created_at: new Date().toISOString()
      }
    ]

    // Store in localStorage
    localStorage.setItem('demo_restaurants', JSON.stringify(demoRestaurants))
    localStorage.setItem('demo_categories', JSON.stringify(demoCategories))
    localStorage.setItem('demo_menu_items', JSON.stringify(demoMenuItems))

    setCreated(true)
    console.log('Demo data created successfully!')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Demo Data</h1>
      <p>This page will create sample restaurants with detailed menu items for testing.</p>
      
      {!created ? (
        <button 
          onClick={createDemoData}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#d4af37',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Create Demo Data
        </button>
      ) : (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#d4f4dd', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>✅ Demo Data Created Successfully!</h3>
          <p>You can now test the restaurant pages:</p>
          <ul>
            <li><Link href="/r/tokyo-sushi-bar">Tokyo Sushi Bar</Link></li>
            <li><Link href="/r/bella-italia">Bella Italia</Link></li>
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
        <Link href="/admin" style={{ color: '#d4af37', textDecoration: 'none' }}>
          ← Back to Admin
        </Link>
      </div>
    </div>
  )
}
