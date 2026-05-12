-- Lock down SECURITY DEFINER functions: revoke from public/anon
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.get_user_roles(uuid) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Allow authenticated users to call the role helpers (needed for RLS evaluation and client RPC)
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_user_roles(uuid) to authenticated;