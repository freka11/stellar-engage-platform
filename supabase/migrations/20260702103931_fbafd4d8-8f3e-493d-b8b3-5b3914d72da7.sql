
-- 1) Prevent self-assigned admin at signup: always insert 'employee'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, email, full_name, department)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'department'
  );

  -- Role is NEVER taken from client metadata. All new users are employees.
  -- Admins can be promoted later by an existing admin via user_roles RLS.
  insert into public.user_roles (user_id, role) values (new.id, 'employee');
  return new;
end;
$function$;

-- 2) Remove enumeration helper. Callers should read user_roles directly under RLS.
REVOKE ALL ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);
