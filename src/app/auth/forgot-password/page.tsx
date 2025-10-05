'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import '../auth.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  
  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        showToast(error.message, 'error')
        return
      }

      setEmailSent(true)
      showToast('Password reset email sent! Check your inbox.', 'success')

    } catch (error) {
      showToast('Failed to send reset email. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h1>Check Your Email</h1>
              <p>We've sent a password reset link to <strong>{email}</strong></p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setEmailSent(false)}
                  className="btn"
                  style={{ padding: '12px 24px' }}
                >
                  Try Different Email
                </button>
                <Link href="/auth/login" className="btn primary" style={{ padding: '12px 24px' }}>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
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
          <div className="row">
            <Link href="/" className="btn small">Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h1>Forgot Password?</h1>
            <p>No worries! Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="btn primary full-width" disabled={loading}>
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link href="/auth/login" className="link">
                Sign in here
              </Link>
            </p>
            <p>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="link">
                Sign up here
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
