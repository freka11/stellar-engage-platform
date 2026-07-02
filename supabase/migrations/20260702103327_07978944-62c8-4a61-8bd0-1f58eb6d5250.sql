
DROP VIEW IF EXISTS public.directory;

-- Reset SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Column-level privileges: authenticated users can only read non-sensitive columns
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, department, avatar_url) ON public.profiles TO authenticated;

CREATE POLICY "Authenticated can view directory fields"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
