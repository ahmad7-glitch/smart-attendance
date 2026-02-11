-- ============================================
-- Smart Attendance System – Database Schema
-- ============================================

-- 1. Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'principal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Attendance logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'INCOMPLETE' CHECK (status IN ('PRESENT', 'LATE', 'INCOMPLETE')),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 3. App settings (configurable thresholds)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default late threshold (07:30 AM)
INSERT INTO public.app_settings (key, value) 
VALUES ('late_threshold', '07:30')
ON CONFLICT (key) DO NOTHING;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_logs(user_id, date);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can update users" ON public.users;
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
DROP POLICY IF EXISTS "Principal can read all users" ON public.users;

DROP POLICY IF EXISTS "Teachers can read own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Teachers can insert own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Teachers can update own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can read all logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can insert logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can update logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can delete logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Principal can read all logs" ON public.attendance_logs;

DROP POLICY IF EXISTS "Admin can read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Principal can read settings" ON public.app_settings;

-- ---- Users Table Policies ----

-- CRITICAL: Allow all authenticated users to read their own profile
-- This breaks the circular dependency
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admin can read all users (using own profile check)
CREATE POLICY "Admin can read all users"
  ON public.users FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can insert users
CREATE POLICY "Admin can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can update users
CREATE POLICY "Admin can update users"
  ON public.users FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can delete users
CREATE POLICY "Admin can delete users"
  ON public.users FOR DELETE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Principal can read all users
CREATE POLICY "Principal can read all users"
  ON public.users FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'principal'
  );

-- ---- Attendance Logs Policies ----

-- Teachers can read their own logs
CREATE POLICY "Teachers can read own logs"
  ON public.attendance_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Teachers can insert their own logs
CREATE POLICY "Teachers can insert own logs"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Teachers can update their own logs (for check-out)
CREATE POLICY "Teachers can update own logs"
  ON public.attendance_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can read all logs
CREATE POLICY "Admin can read all logs"
  ON public.attendance_logs FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can insert logs
CREATE POLICY "Admin can insert logs"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can update logs
CREATE POLICY "Admin can update logs"
  ON public.attendance_logs FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can delete logs
CREATE POLICY "Admin can delete logs"
  ON public.attendance_logs FOR DELETE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Principal can read all logs (read-only)
CREATE POLICY "Principal can read all logs"
  ON public.attendance_logs FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'principal'
  );

-- ---- App Settings Policies ----

-- Admin can read settings
CREATE POLICY "Admin can read settings"
  ON public.app_settings FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can update settings
CREATE POLICY "Admin can update settings"
  ON public.app_settings FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Principal can read settings
CREATE POLICY "Principal can read settings"
  ON public.app_settings FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'principal'
  );
