
-- 1) Restrict profiles SELECT
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Safe directory view (no email)
CREATE OR REPLACE VIEW public.directory
WITH (security_invoker = true) AS
SELECT id, full_name, department, avatar_url
FROM public.profiles;

GRANT SELECT ON public.directory TO authenticated;

-- Allow the view to read rows regardless of caller identity (view is public directory)
CREATE POLICY "Directory readable by authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Wait — that would re-open everything. Instead drop and use a SECURITY DEFINER wrapper.
DROP POLICY "Directory readable by authenticated" ON public.profiles;

-- Recreate view as security definer function-backed view
DROP VIEW IF EXISTS public.directory;

CREATE OR REPLACE FUNCTION public.get_directory()
RETURNS TABLE (id uuid, full_name text, department text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, department, avatar_url FROM public.profiles ORDER BY full_name;
$$;

REVOKE ALL ON FUNCTION public.get_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_directory() TO authenticated;

-- 3) Lock down get_user_roles (not needed by client; policies use has_role directly)
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon, authenticated;
