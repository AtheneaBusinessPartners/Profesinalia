-- Corrige una fuga real: "businesses_public_select" dejaba leer TODAS las
-- columnas (teléfono, email...) de TODOS los negocios a cualquiera con la
-- anon key (que es pública por diseño, va en el propio código del navegador).
-- La página pública /c/[slug] solo necesita nombre/descripción/zona de UN
-- negocio, y ya existía una función get_public_business para eso: ahora es
-- el único camino de lectura pública.

drop policy if exists "businesses_public_select" on public.businesses;

create policy "businesses_owner_select"
  on public.businesses for select
  using (owner_id = auth.uid());

create policy "businesses_admin_select"
  on public.businesses for select
  using (public.is_admin());

-- get_public_business necesita devolver también "approved" para que la
-- página pública pueda mostrar el aviso de "enlace no activo todavía".
drop function if exists public.get_public_business(text);

create function public.get_public_business(p_slug text)
returns table (id uuid, name text, description text, zone text, approved boolean)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, description, zone, approved from public.businesses where slug = p_slug;
$$;

grant execute on function public.get_public_business(text) to anon, authenticated;
