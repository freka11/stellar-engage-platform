
DROP FUNCTION IF EXISTS public.get_directory();

CREATE VIEW public.directory
WITH (security_invoker = false) AS
SELECT id, full_name, department, avatar_url
FROM public.profiles
ORDER BY full_name;

REVOKE ALL ON public.directory FROM PUBLIC, anon;
GRANT SELECT ON public.directory TO authenticated;
