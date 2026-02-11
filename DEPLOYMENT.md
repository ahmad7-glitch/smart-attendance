# Deployment Instructions – Smart Attendance System

## Prerequisites

1. **Node.js** 18+ installed
2. **Supabase** project created at [supabase.com](https://supabase.com)
3. **Vercel** account at [vercel.com](https://vercel.com)

---

## Step 1: Set Up Supabase

1. Create a new project on [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon (public) key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

4. **Create your first admin user:**
   - Go to **Authentication → Users → Add User**
   - Create a user with email/password
   - Then in **SQL Editor**, run:
   ```sql
   INSERT INTO public.users (id, full_name, role)
   VALUES ('<user-uuid-from-auth>', 'Admin Name', 'admin');
   ```

5. **Enable Realtime** for `attendance_logs`:
   - Go to **Database → Replication**
   - Enable replication for the `attendance_logs` table

---

## Step 2: Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to test locally.

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy to production
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**

---

## Step 4: Post-Deployment

1. Update **Supabase Auth → URL Configuration**:
   - Set Site URL to your Vercel deployment URL
   - Add redirect URLs as needed

2. Test all features:
   - Login flow
   - Teacher check-in/out
   - Admin CRUD
   - Principal dashboard
   - Report downloads

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role key (bypasses RLS) |

> ⚠️ **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It is only used in server actions and API routes.
