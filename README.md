# JUSBA Donation Pledge

A simple website to collect donation **pledges** (name, email, phone, amount, event). No payment is processed.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase (database + admin auth)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database schema

In the [Supabase SQL Editor](https://supabase.com/dashboard), run the SQL in:

`supabase/migrations/001_initial.sql`

This creates the `events` and `pledges` tables, row-level security policies, and sample events.

### 4. Create an admin user

In Supabase: **Authentication → Users → Add user** (email + password).

Only authenticated users can manage events and view pledges.

### 5. Run locally

```bash
npm run dev
```

- Public pledge form: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

## Deploy

Build with `npm run build`. Deploy the `dist/` folder to Vercel, Netlify, or GitHub Pages.

Set the same `VITE_SUPABASE_*` environment variables in your hosting provider.

In Supabase **Authentication → URL configuration**, add your production URL to allowed redirect URLs.

## Project structure

```
src/
  pages/PledgeForm.tsx      # public form
  pages/admin/Login.tsx     # admin sign-in
  pages/admin/Events.tsx    # manage dropdown events
  pages/admin/Pledges.tsx   # view & export pledges
supabase/migrations/        # database schema
```
