import { supabaseBrowser } from './supabase-browser'

export const handleSignOut = async () => {
  try {
    const sb = supabaseBrowser()
    
    // Sign out from Supabase
    const { error } = await sb.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
    }
    
    // Clear all local data
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Redirect to homepage
    window.location.href = '/'
    
  } catch (error) {
    console.error('Sign out error:', error)
    // Even if there's an error, clear everything and redirect
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }
}
