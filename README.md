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

Then run `supabase/migrations/002_pledge_payment_received.sql` to add payment tracking and admin update/delete permissions on pledges.

### 4. Create an admin user

In Supabase: **Authentication → Users → Add user** (email + password).

Only authenticated users can manage events and view pledges.

### 5. Run locally

```bash
npm run dev
```

- Public pledge form: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

## Deploy (GitHub Pages)

Live site: https://suchitbhayani.github.io/jusba-donation/

Pushes to `main` deploy automatically via GitHub Actions.

### One-time setup

1. In GitHub repo **Settings → Secrets and variables → Actions**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. In **Settings → Pages**, set **Source** to **GitHub Actions** (if not already).
3. In Supabase **Authentication → URL configuration**, add:
   - `https://suchitbhayani.github.io/jusba-donation/`
   - `https://suchitbhayani.github.io/jusba-donation/**`

## Project structure

```
src/
  pages/PledgeForm.tsx      # public form
  pages/admin/Login.tsx     # admin sign-in
  pages/admin/Events.tsx    # manage dropdown events
  pages/admin/Pledges.tsx   # view & export pledges
supabase/migrations/        # database schema
```
