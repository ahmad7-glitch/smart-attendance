-- =========================================================
-- ADD EMAIL COLUMN & SYNC TRIGGER
-- =========================================================

-- 1. Add email column to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create a function to handle new user signup (auto-insert into public.users)
--    This replaces manual insert if we rely on this trigger, 
--    BUT for our app we manually insert in createTeacher.
--    However, it's good practice to have a trigger for direct signups if any.
--    For now, let's just make sure we can fetch email.

-- 3. Backfill email for existing users (Security Definer required to read auth.users)
CREATE OR REPLACE FUNCTION public.backfill_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users u
  SET email = au.email
  FROM auth.users au
  WHERE u.id = au.id
  AND u.email IS NULL;
END;
$$;

-- Run backfill
SELECT public.backfill_emails();

-- 4. Create trigger to keep email in sync on update (optional but good)
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email();

-- 5. Trigger to insert new user if not exists (Auto-create profile)
--    Useful if user signs up via other means
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  )
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
