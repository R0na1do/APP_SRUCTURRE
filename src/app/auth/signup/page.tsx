'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import '../auth.css'

interface SignupForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  userType: 'customer' | 'owner'
  restaurantName?: string
  restaurantAddress?: string
}

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'customer',
    restaurantName: '',
    restaurantAddress: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordStrengthText, setPasswordStrengthText] = useState('')
  
  const router = useRouter()
  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    let text = ''

    if (password.length >= 8) score += 25
    if (password.match(/[a-z]/)) score += 25
    if (password.match(/[A-Z]/)) score += 25
    if (password.match(/[0-9]/)) score += 25
    if (password.match(/[^a-zA-Z0-9]/)) score += 25

    if (score < 25) text = 'Very Weak'
    else if (score < 50) text = 'Weak'
    else if (score < 75) text = 'Good'
    else if (score < 100) text = 'Strong'
    else text = 'Very Strong'

    setPasswordStrength(Math.min(score, 100))
    setPasswordStrengthText(text)
  }

  const handlePasswordChange = (password: string) => {
    setForm(prev => ({ ...prev, password }))
    calculatePasswordStrength(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      setLoading(false)
      return
    }

    if (form.userType === 'owner' && (!form.restaurantName || !form.restaurantAddress)) {
      showToast('Restaurant name and address are required for owners', 'error')
      setLoading(false)
      return
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            user_type: form.userType
          }
        }
      })

      if (authError) {
        showToast(authError.message, 'error')
        return
      }

      if (authData.user) {
        // If restaurant owner, create restaurant
        if (form.userType === 'owner' && form.restaurantName && form.restaurantAddress) {
          const { error: restaurantError } = await sb
            .from('restaurants')
            .insert({
              name: form.restaurantName,
              address: form.restaurantAddress,
              owner_user_id: authData.user.id,
              slug: form.restaurantName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
              description: `Welcome to ${form.restaurantName}!`,
              phone: '',
              avg_rating: 0,
              review_count: 0
            })

          if (restaurantError) {
            showToast(`Account created but restaurant creation failed: ${restaurantError.message}`, 'error')
            return
          }
        }

        // Check if email confirmation is required
        if (authData.user && !authData.user.email_confirmed_at) {
          showToast('Account created! Please check your email and click the verification link to activate your account.', 'success')
          
          // Redirect to login page after delay
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        } else {
          // Create demo user for user management
          const demoUser = {
            id: authData.user.id,
            email: authData.user.email,
            created_at: authData.user.created_at,
            last_sign_in_at: new Date().toISOString(),
            user_metadata: {
              first_name: form.firstName,
              last_name: form.lastName,
              user_type: form.userType
            }
          }
          
          // Store in localStorage for demo purposes
          const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
          existingUsers.push(demoUser)
          localStorage.setItem('demo_users', JSON.stringify(existingUsers))
          
          showToast('Account created successfully!', 'success')
          
          // Redirect after a short delay
          setTimeout(() => {
            if (form.userType === 'owner') {
              router.push('/admin')
            } else {
              router.push('/')
            }
          }, 2000)
        }
      }

    } catch (error) {
      showToast('Signup failed. Please try again.', 'error')
    } finally {
      setLoading(false)
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
          <div className="row">
            <Link href="/" className="btn small">Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Join MagicMenu</h1>
            <p>Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="user-type-selector">
              <label>I am a:</label>
              <div className="radio-group">
                <div 
                  className={`radio-option ${form.userType === 'customer' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, userType: 'customer' }))}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={form.userType === 'customer'}
                    onChange={() => {}}
                  />
                  <span>Customer</span>
                </div>
                <div 
                  className={`radio-option ${form.userType === 'owner' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, userType: 'owner' }))}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="owner"
                    checked={form.userType === 'owner'}
                    onChange={() => {}}
                  />
                  <span>Restaurant Owner</span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
                className={form.email && !form.email.includes('@') ? 'invalid' : 'valid'}
              />
              {form.email && !form.email.includes('@') && (
                <div className="field-hint error">Please enter a valid email address</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={form.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: `${passwordStrength}%`,
                          backgroundColor: passwordStrength < 25 ? '#ef4444' : 
                                         passwordStrength < 50 ? '#f59e0b' : 
                                         passwordStrength < 75 ? '#3b82f6' : '#10b981'
                        }}
                      ></div>
                    </div>
                    <span className="strength-text" style={{
                      color: passwordStrength < 25 ? '#ef4444' : 
                             passwordStrength < 50 ? '#f59e0b' : 
                             passwordStrength < 75 ? '#3b82f6' : '#10b981'
                    }}>
                      {passwordStrengthText}
                    </span>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  className={form.confirmPassword && form.password !== form.confirmPassword ? 'invalid' : 'valid'}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div className="field-hint error">Passwords do not match</div>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password.length > 0 && (
                  <div className="field-hint success">✓ Passwords match</div>
                )}
              </div>
            </div>

            {form.userType === 'owner' && (
              <>
                <div className="divider">
                  <span>Restaurant Information</span>
                </div>
                
                <div className="form-group">
                  <label htmlFor="restaurantName">Restaurant Name</label>
                  <input
                    type="text"
                    id="restaurantName"
                    value={form.restaurantName || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, restaurantName: e.target.value }))}
                    placeholder="My Amazing Restaurant"
                    required={form.userType === 'owner'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="restaurantAddress">Restaurant Address</label>
                  <input
                    type="text"
                    id="restaurantAddress"
                    value={form.restaurantAddress || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, restaurantAddress: e.target.value }))}
                    placeholder="123 Main St, City, State 12345"
                    required={form.userType === 'owner'}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn primary full-width" disabled={loading}>
              <span className="btn-text">{loading ? 'Creating Account...' : 'Create Account'}</span>
              {loading && (
                <div className="btn-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login" className="link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>

      {toast && (
        <div className={`toast show ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
