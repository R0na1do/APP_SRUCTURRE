'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import '../admin.css'

interface Review {
  id: string
  restaurant_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  restaurant_name?: string
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editForm, setEditForm] = useState({
    rating: 0,
    comment: ''
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadReviews = async () => {
    setLoading(true)
    try {
      // First try to load from localStorage (demo data)
      if (typeof window !== 'undefined') {
        const demoReviews = JSON.parse(localStorage.getItem('demo_reviews') || '[]')
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const demoRestaurants = JSON.parse(localStorage.getItem('demo_restaurants') || '[]')
        
        const reviewsWithDetails = demoReviews.map((review: any) => {
          const user = demoUsers.find((u: any) => u.id === review.user_id)
          const restaurant = demoRestaurants.find((r: any) => r.id === review.restaurant_id)
          
          return {
            ...review,
            user_name: user?.user_metadata?.first_name || user?.email || 'Unknown User',
            user_email: user?.email || 'Unknown Email',
            restaurant_name: restaurant?.name || 'Unknown Restaurant'
          }
        })
        
        setReviews(reviewsWithDetails)
        setLoading(false)
        return
      }
      
      // Fallback to Supabase
      const sb = supabaseBrowser()
      const { data, error } = await sb
        .from('reviews')
        .select(`
          *,
          users:user_id (email, user_metadata),
          restaurants:restaurant_id (name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading reviews:', error)
        showToast('Failed to load reviews', 'error')
      } else {
        const formattedReviews = data?.map((review: any) => ({
          ...review,
          user_name: review.users?.user_metadata?.first_name || review.users?.email || 'Unknown User',
          user_email: review.users?.email || 'Unknown Email',
          restaurant_name: review.restaurants?.name || 'Unknown Restaurant'
        })) || []
        
        setReviews(formattedReviews)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      showToast('Failed to load reviews', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setEditForm({
      rating: review.rating,
      comment: review.comment
    })
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return

    try {
      // Update in localStorage (demo data)
      if (typeof window !== 'undefined') {
        const demoReviews = JSON.parse(localStorage.getItem('demo_reviews') || '[]')
        const updatedReviews = demoReviews.map((r: any) => 
          r.id === editingReview.id 
            ? { ...r, rating: editForm.rating, comment: editForm.comment, updated_at: new Date().toISOString() }
            : r
        )
        localStorage.setItem('demo_reviews', JSON.stringify(updatedReviews))
        
        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === editingReview.id 
            ? { ...r, rating: editForm.rating, comment: editForm.comment, updated_at: new Date().toISOString() }
            : r
        ))
        
        showToast('Review updated successfully', 'success')
        setEditingReview(null)
        return
      }

      // Update in Supabase
      const sb = supabaseBrowser()
      const { error } = await sb
        .from('reviews')
        .update({
          rating: editForm.rating,
          comment: editForm.comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReview.id)

      if (error) {
        showToast('Failed to update review', 'error')
      } else {
        showToast('Review updated successfully', 'success')
        loadReviews()
        setEditingReview(null)
      }
    } catch (error) {
      console.error('Error updating review:', error)
      showToast('Failed to update review', 'error')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      // Delete from localStorage (demo data)
      if (typeof window !== 'undefined') {
        const demoReviews = JSON.parse(localStorage.getItem('demo_reviews') || '[]')
        const updatedReviews = demoReviews.filter((r: any) => r.id !== reviewId)
        localStorage.setItem('demo_reviews', JSON.stringify(updatedReviews))
        
        // Update local state
        setReviews(prev => prev.filter(r => r.id !== reviewId))
        
        showToast('Review deleted successfully', 'success')
        return
      }

      // Delete from Supabase
      const sb = supabaseBrowser()
      const { error } = await sb
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) {
        showToast('Failed to delete review', 'error')
      } else {
        showToast('Review deleted successfully', 'success')
        loadReviews()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      showToast('Failed to delete review', 'error')
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRating = filterRating === null || review.rating === filterRating
    
    return matchesSearch && matchesRating
  })

  useEffect(() => {
    loadReviews()
  }, [])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffd700' : '#ddd' }}>
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
          <div className="nav">
            <Link href="/admin" role="tab" aria-selected="false">
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
            <Link href="/admin/reviews" role="tab" aria-selected="true">
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
                    style={{ background: '#dc3545', color: 'white', border: 'none' }}
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
            <h1 className="title">📝 Reviews</h1>
            <p className="subtitle">View, edit, and manage customer reviews</p>
          </div>
          <div className="filters">
            <div className="input">
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '300px' }}
              />
            </div>
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="input"
              style={{ width: '150px' }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : (
          <div className="grid">
            {filteredReviews.length === 0 ? (
              <div className="empty-state">
                <h3>No reviews found</h3>
                <p>No reviews match your current filters.</p>
              </div>
            ) : (
              filteredReviews.map(review => (
                <div key={review.id} className="card">
                  <div className="card-header">
                    <div className="review-info">
                      <h3>{review.restaurant_name}</h3>
                      <div className="rating">
                        {renderStars(review.rating)}
                        <span className="rating-text">({review.rating}/5)</span>
                      </div>
                    </div>
                    <div className="review-actions">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="btn small"
                        style={{ background: '#007bff', color: 'white', marginRight: '8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="btn small"
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="review-comment">
                      <p><strong>Comment:</strong></p>
                      <p>{review.comment}</p>
                    </div>
                    <div className="review-meta">
                      <p><strong>Reviewer:</strong> {review.user_name} ({review.user_email})</p>
                      <p><strong>Date:</strong> {new Date(review.created_at).toLocaleDateString()}</p>
                      {review.updated_at !== review.created_at && (
                        <p><strong>Last Updated:</strong> {new Date(review.updated_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editingReview && (
          <div className="modal-overlay" onClick={() => setEditingReview(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Review</h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="close"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rating:</label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Comment:</label>
                  <textarea
                    value={editForm.comment}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                    className="input"
                    rows={4}
                    placeholder="Enter review comment..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => setEditingReview(null)}
                  className="btn"
                  style={{ background: '#6c757d', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn"
                  style={{ background: '#28a745', color: 'white' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </main>
    </>
  )
}
