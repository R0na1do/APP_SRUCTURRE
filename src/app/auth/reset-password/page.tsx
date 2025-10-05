'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import '../auth.css'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [validSession, setValidSession] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const sb = supabaseBrowser()

  useEffect(() => {
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      const { data: { session } } = await sb.auth.getSession()
      setValidSession(!!session)
    }
    checkSession()
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      setLoading(false)
      return
    }

    try {
      const { error } = await sb.auth.updateUser({
        password: password
      })

      if (error) {
        showToast(error.message, 'error')
        return
      }

      showToast('Password updated successfully!', 'success')
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (error) {
      showToast('Failed to update password. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession) {
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h1>Invalid Reset Link</h1>
              <p>This password reset link is invalid or has expired.</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link href="/auth/forgot-password" className="btn primary" style={{ padding: '12px 24px' }}>
                Request New Reset Link
              </Link>
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h1>Set New Password</h1>
            <p>Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="btn primary full-width" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
