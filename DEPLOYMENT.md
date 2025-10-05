# Deployment Guide

## 🚀 Quick Setup (5 minutes)

### Option 1: Vercel (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Import your GitHub repository**
3. **Add Environment Variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google Maps features (optional)
4. **Deploy!** Vercel will automatically deploy your app

### Option 2: GitHub Actions Build Check

The GitHub Actions workflow now just checks that your app builds successfully. This is perfect for:
- ✅ Verifying your code works before manual deployment
- ✅ Running on every push and pull request
- ✅ Ensuring your Supabase secrets are properly configured

### Supabase Setup (Required for both options)

1. **In Supabase SQL Editor**, run the schema from your database setup
2. **Create storage buckets** (public read):
   - `restaurant-logos`
   - `dish-images` 
   - `qr-codes`

### GitHub Secrets (For Build Check)

Add these in **Settings** → **Secrets and variables** → **Actions**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)

## 🎯 Result

- **Vercel**: Your app will be live with automatic deployments
- **GitHub Actions**: Build verification on every push
- **Your design**: 100% preserved and working perfectly!

That's it! Your beautiful MagicMenu app is ready for the world! 🌟
