# MagicMenu (Starter)

A minimal Next.js + Supabase app for visual menus, QR access, and ratings.

## Setup
1. `npm install`
2. Copy `env.example` → `.env.local` and fill values from **Supabase → Settings → API**
3. In Supabase SQL Editor, run everything in `db/schema.sql`
4. Create Storage buckets in Supabase: `restaurant-logos`, `dish-images`, `qr-codes` (public read)
5. `npm run dev` and open http://localhost:3000

## Generate a QR
POST to `/api/restaurants/{id}/qr` with your restaurant id. The route uploads a PNG in Storage and writes `qr_url`.

## Rate a restaurant
Open `/r/[slug]`, pick stars, optional comment, submit.

> This starter uses a placeholder `user_id`. Replace with real Auth session id.

## Features

* Public restaurant pages with menus & images
* Ratings (0–5 stars) and review upsert
* QR code generation route that saves to Supabase Storage
* Supabase Auth, DB, and Storage wiring

> Stack: Next.js 14 (App Router) • TypeScript • Tailwind • Supabase (Auth/Postgres/Storage)

## Project Structure

```
MagicMenu/
├─ package.json
├─ next.config.js
├─ postcss.config.js
├─ tailwind.config.ts
├─ tsconfig.json
├─ env.example
├─ README.md
├─ db/
│  └─ schema.sql
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ page.tsx
│  │  ├─ r/
│  │  │  └─ [slug]/page.tsx
│  │  ├─ api/
│  │  │  ├─ reviews/route.ts
│  │  │  └─ restaurants/[id]/qr/route.ts
│  ├─ components/
│  │  ├─ StarRating.tsx
│  │  └─ Price.tsx
│  └─ lib/
│     ├─ supabase-browser.ts
│     └─ supabase-server.ts
└─ public/
   └─ placeholder-dish.jpg
```

## Next Steps

* Replace the review form's placeholder `user_id` with your actual user from Supabase Auth.
* Tighten RLS for writes (see full policies in the earlier build guide).
* Add image uploads in your dashboard later (this starter reads display images; upload UI omitted for brevity).
* For AI image fallback, add an API route that calls your image provider and stores to `dish-images`.
* Replace `public/placeholder-dish.jpg` with an actual placeholder image.
