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

### 4. Create admin users

**Option A — Invite by email (recommended)**

1. Supabase → **Authentication → Users → Invite user**
2. Enter their email and send the invitation
3. They click the link in the email and land on **Set your admin password**
4. After saving, they can log in at `/admin/login`

**Option B — Create with a password**

Supabase → **Authentication → Users → Add user** (email + password).

Only authenticated users can manage events and view pledges.

**Supabase URL configuration** (required for invites and password reset):

- Site URL: `https://suchitbhayani.github.io/jusba-donation/`
- Redirect URLs:
  - `https://suchitbhayani.github.io/jusba-donation/admin/set-password`
  - `https://suchitbhayani.github.io/jusba-donation/**`

### 5. Run locally

```bash
npm run dev
```

- Public pledge form: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

### 6. Pledge confirmation emails (optional)

Pledgers receive a confirmation email after submitting. This uses a **Supabase Edge Function** and [Resend](https://resend.com) (free tier: 100 emails/day).

1. Create a [Resend](https://resend.com) account and API key
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Set secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxx
   supabase secrets set PLEDGE_CONFIRMATION_FROM="JUSBA <onboarding@resend.dev>"
   ```
   For production, verify your domain in Resend and use e.g. `JUSBA <donations@yourdomain.com>`.
5. Deploy the function:
   ```bash
   supabase functions deploy send-pledge-confirmation
   ```

Pledges still save if email is not configured; the form will note when confirmation could not be sent.

## Deploy (GitHub Pages)

Live site: https://suchitbhayani.github.io/jusba-donation/

Pushes to `main` deploy automatically via GitHub Actions.

### One-time setup

1. In GitHub repo **Settings → Secrets and variables → Actions**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. In **Settings → Pages**, set **Source** to **GitHub Actions** (if not already).
3. In Supabase **Authentication → URL configuration**, add:
   - Site URL: `https://suchitbhayani.github.io/jusba-donation/`
   - Redirect URLs:
     - `https://suchitbhayani.github.io/jusba-donation/admin/set-password`
     - `https://suchitbhayani.github.io/jusba-donation/**`

## Project structure

```
src/
  pages/PledgeForm.tsx      # public form
  pages/admin/Login.tsx     # admin sign-in
  pages/admin/Events.tsx    # manage dropdown events
  pages/admin/Pledges.tsx   # view & export pledges
supabase/migrations/        # database schema
supabase/functions/           # edge functions (confirmation email)
```
