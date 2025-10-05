import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const supabaseBrowser = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } }
    )
  }
  return supabaseInstance
}
