-- ============================================
-- GPS Attendance Validation – Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. School Settings Table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'SMP NU ASSALAFIE',
  latitude FLOAT8 NOT NULL DEFAULT 0,
  longitude FLOAT8 NOT NULL DEFAULT 0,
  allowed_radius_meters INT NOT NULL DEFAULT 100,
  max_accuracy_meters INT NOT NULL DEFAULT 100,
  start_time TIME NOT NULL DEFAULT '07:00',
  end_time TIME NOT NULL DEFAULT '14:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row (will be updated by admin)
INSERT INTO public.school_settings (school_name, latitude, longitude, allowed_radius_meters, max_accuracy_meters, start_time, end_time)
VALUES ('SMP NU ASSALAFIE', 0, 0, 100, 100, '07:00', '14:00')
ON CONFLICT DO NOTHING;

-- 2. Extend attendance_logs with GPS columns
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS check_in_lat FLOAT8,
  ADD COLUMN IF NOT EXISTS check_in_lng FLOAT8,
  ADD COLUMN IF NOT EXISTS check_out_lat FLOAT8,
  ADD COLUMN IF NOT EXISTS check_out_lng FLOAT8,
  ADD COLUMN IF NOT EXISTS distance_from_school_meters FLOAT8,
  ADD COLUMN IF NOT EXISTS location_accuracy FLOAT8;

-- 3. Index for GPS queries
CREATE INDEX IF NOT EXISTS idx_attendance_distance ON public.attendance_logs(distance_from_school_meters);

-- ============================================
-- RLS Policies for school_settings
-- ============================================

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anyone authenticated can read school settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can insert school settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can update school settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can delete school settings" ON public.school_settings;

-- All authenticated users can read (needed by teacher check-in server action)
CREATE POLICY "Anyone authenticated can read school settings"
  ON public.school_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can modify
CREATE POLICY "Admin can insert school settings"
  ON public.school_settings FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can update school settings"
  ON public.school_settings FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can delete school settings"
  ON public.school_settings FOR DELETE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
