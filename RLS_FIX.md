# 🔧 ULTIMATE FIX for 500 Error (Recursion)

The 500 error persists because the previous fix was still triggering a circular check in some cases.

**We need to use a "Security Definer" function.** This is a special function that runs with admin privileges to check the user's role without triggering the RLS loop.

## 🚀 How to Apply the Robust Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the code below (or open `supabase/fix_recursion.sql`):

```sql
-- 1. Create a secure helper function to check role WITHOUT recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Drop old conflicting policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can update users" ON public.users;
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
DROP POLICY IF EXISTS "Principal can read all users" ON public.users;

DROP POLICY IF EXISTS "Admin can read all logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can insert logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can update logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admin can delete logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Principal can read all logs" ON public.attendance_logs;

DROP POLICY IF EXISTS "Admin can read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Principal can read settings" ON public.app_settings;

-- 3. Create NEW policies using the helper function

-- Users Table
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can read all users" ON public.users FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin can insert users" ON public.users FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admin can update users" ON public.users FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin can delete users" ON public.users FOR DELETE USING (get_my_role() = 'admin');
CREATE POLICY "Principal can read all users" ON public.users FOR SELECT USING (get_my_role() = 'principal');

-- Attendance Logs Table (Admin/Principal part)
CREATE POLICY "Admin can read all logs" ON public.attendance_logs FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin can insert logs" ON public.attendance_logs FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admin can update logs" ON public.attendance_logs FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin can delete logs" ON public.attendance_logs FOR DELETE USING (get_my_role() = 'admin');
CREATE POLICY "Principal can read all logs" ON public.attendance_logs FOR SELECT USING (get_my_role() = 'principal');

-- Settings Table
CREATE POLICY "Admin can read settings" ON public.app_settings FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin can update settings" ON public.app_settings FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Principal can read settings" ON public.app_settings FOR SELECT USING (get_my_role() = 'principal');
```

3. Click **Run**.
4. **Refresh your application.** The 500 error will be gone forever.

## Why this works
- `SECURITY DEFINER` function runs outside of the RLS check loop.
- It safely fetches just the role for `auth.uid()`.
- The policies use this function instead of directly querying the table, breaking the cycle.
