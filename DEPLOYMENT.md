# GitHub Pages Deployment Guide

## Quick Setup (5 minutes)

### 1. Repository Setup
- Make sure your repository name matches what you want in the URL (e.g., `magicmenu`)
- Your GitHub Pages URL will be: `https://yourusername.github.io/repository-name`

### 2. GitHub Pages Configuration
1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The deployment will start automatically on your next push

### 3. Add Your Secrets
Go to **Settings** → **Secrets and variables** → **Actions** and add:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Optional:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google Maps features
- `NEXT_PUBLIC_SITE_URL` - Your GitHub Pages URL (e.g., `https://yourusername.github.io/magicmenu`)

### 4. Supabase Setup
1. In Supabase SQL Editor, run the schema from your database setup
2. Create these storage buckets (public read):
   - `restaurant-logos`
   - `dish-images` 
   - `qr-codes`

### 5. Deploy
Push to main/master branch - GitHub Actions will automatically build and deploy!

## Repository Name Important
If your repository is NOT named `magicmenu`, update the `basePath` in `next.config.js`:
```javascript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
```

That's it! Your app will be live at your GitHub Pages URL.
