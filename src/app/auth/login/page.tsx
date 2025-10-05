'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import '../auth.css'

export default function LoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    userType: 'customer' as 'customer' | 'owner',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()
  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (error) {
        showToast(error.message, 'error')
        return
      }

      if (data.user) {
        // Handle Remember Me functionality
        if (form.rememberMe) {
          // Set session to persist for 30 days
          await sb.auth.setSession({
            access_token: data.session?.access_token || '',
            refresh_token: data.session?.refresh_token || ''
          })
        }
        
        // Create demo user for user management
        const demoUser = {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          last_sign_in_at: new Date().toISOString(),
          user_metadata: {
            first_name: data.user.user_metadata?.first_name,
            last_name: data.user.user_metadata?.last_name,
            user_type: form.userType
          }
        }
        
        // Store in localStorage for demo purposes
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const userExists = existingUsers.find((u: any) => u.id === data.user.id)
        
        if (!userExists) {
          existingUsers.push(demoUser)
          localStorage.setItem('demo_users', JSON.stringify(existingUsers))
        } else {
          // Update last sign in
          const updatedUsers = existingUsers.map((u: any) => 
            u.id === data.user.id ? { ...u, last_sign_in_at: new Date().toISOString() } : u
          )
          localStorage.setItem('demo_users', JSON.stringify(updatedUsers))
        }
        
        showToast('Login successful!', 'success')
        
        // Check if user is super admin
        const superAdminEmails = [
          'admin@magicmenu.com',
          'owner@magicmenu.com',
          'ron.degtyar@gmail.com',
          // Add your email here
          data.user.email
        ]
        
        const isSuperAdmin = superAdminEmails.includes(data.user.email || '')
        
        console.log('User email:', data.user.email)
        console.log('Is super admin:', isSuperAdmin)
        console.log('User type selected:', form.userType)
        console.log('Super admin emails list:', [
          'admin@magicmenu.com',
          'owner@magicmenu.com',
          'ron.degtyar@gmail.com'
        ])
        
        // Redirect based on user type and admin status
        setTimeout(() => {
          if (form.userType === 'owner' || isSuperAdmin) {
            console.log('Redirecting to admin dashboard...')
            window.location.href = '/admin'
          } else {
            window.location.href = '/'
          }
        }, 1000) // Wait 1 second for the toast to show
      }

    } catch (error) {
      showToast('Login failed. Please try again.', 'error')
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
            <h1>Welcome Back</h1>
            <p>Sign in to your MagicMenu account</p>
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

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={form.rememberMe}
                onChange={(e) => setForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="rememberMe" style={{ margin: 0, fontSize: '14px', cursor: 'pointer' }}>
                Remember me for 30 days
              </label>
            </div>

            <button type="submit" className="btn primary full-width" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="link">
                Sign up here
              </Link>
            </p>
            <p>
              <Link href="/auth/forgot-password" className="link">
                Forgot your password?
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
