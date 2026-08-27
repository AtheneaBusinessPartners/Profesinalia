-- La app pasa de ser solo para aire acondicionado a soportar varios
-- oficios (electricista, fontanero, pintor...). Cada negocio declara su
-- oficio, y el formulario público le muestra las preguntas adecuadas.

alter table public.businesses
  add column if not exists trade text not null default 'aire_acondicionado'
  check (trade in ('aire_acondicionado', 'electricista', 'fontanero', 'pintor'));

-- get_public_business necesita devolver también el oficio, para que el
-- formulario público sepa qué preguntas mostrar.
drop function if exists public.get_public_business(text);

create function public.get_public_business(p_slug text)
returns table (id uuid, name text, description text, zone text, approved boolean, trade text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, description, zone, approved, trade from public.businesses where slug = p_slug;
$$;

grant execute on function public.get_public_business(text) to anon, authenticated;
