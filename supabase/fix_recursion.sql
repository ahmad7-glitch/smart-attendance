-- FIX: RLS RECURSION using SECURITY DEFINER function

-- 1. Create helper function to check role WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Clean up old policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can update users" ON public.users;
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
DROP POLICY IF EXISTS "Principal can read all users" ON public.users;

-- 3. New non-recursive policies

-- Anyone can read their own profile
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Admin policies using helper function
CREATE POLICY "Admin can read all users" ON public.users FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin can insert users" ON public.users FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Admin can update users" ON public.users FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin can delete users" ON public.users FOR DELETE USING (get_my_role() = 'admin');

-- Principal policies
CREATE POLICY "Principal can read all users" ON public.users FOR SELECT USING (get_my_role() = 'principal');
