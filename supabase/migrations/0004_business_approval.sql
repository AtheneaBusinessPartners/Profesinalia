-- Requiere aprobación manual del superadmin antes de que un negocio pueda
-- usar su enlace público. El registro sigue siendo autoservicio; lo único
-- que cambia es que el enlace y el dashboard no funcionan hasta aprobarlo.

alter table public.businesses add column if not exists approved boolean not null default false;

-- Solo el superadmin puede aprobar negocios (los propios dueños no son "owner"
-- de otro negocio, así que necesitan una policy de update propia).
create policy "businesses_admin_update"
  on public.businesses for update
  using (public.is_admin())
  with check (public.is_admin());

-- Aunque un dueño intente colar approved=true en su propio update (p.ej. desde
-- devtools), este trigger lo revierte salvo que quien actualiza sea admin.
create or replace function public.protect_business_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.approved is distinct from old.approved then
    new.approved := old.approved;
  end if;
  return new;
end;
$$;

create trigger businesses_protect_approval
  before update on public.businesses
  for each row execute procedure public.protect_business_approval();

-- El primer negocio que crees tú mismo para probar, apruébalo a mano:
-- update public.businesses set approved = true where slug = 'tu-slug';
