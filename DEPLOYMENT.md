# Vercel Deployment Guide

## Quick Setup (5 minutes)

### 1. Vercel Setup
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Import your GitHub repository
3. Vercel will automatically detect it's a Next.js app

### 2. Environment Variables
In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Optional:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google Maps features

### 3. Supabase Setup
1. In Supabase SQL Editor, run the schema from your database setup
2. Create these storage buckets (public read):
   - `restaurant-logos`
   - `dish-images` 
   - `qr-codes`

### 4. Deploy
1. Push to main/master branch
2. Vercel will automatically deploy your app
3. Your app will be live at your Vercel URL

## Alternative: Manual Vercel Deploy
If you prefer to use GitHub Actions:

1. Get your Vercel credentials:
   - Vercel Token: Go to Vercel → Settings → Tokens
   - Org ID: Found in Vercel project settings
   - Project ID: Found in Vercel project settings

2. Add these as GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` 
   - `VERCEL_PROJECT_ID`

3. Push to trigger automatic deployment via GitHub Actions

That's it! Your app will be live on Vercel with all dynamic features working perfectly.
