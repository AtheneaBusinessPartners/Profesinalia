-- Fallo real detectado por el usuario: se creaba una "solicitud" visible
-- para el profesional en cuanto el cliente ponía nombre y teléfono, aunque
-- cerrara la página sin rellenar nada más. Ahora un job solo cuenta como
-- solicitud real cuando el cliente pulsa "Enviar solicitud".

alter table public.jobs add column if not exists submitted_at timestamptz;

create or replace function public.submit_job_data(
  p_job_id uuid,
  p_token uuid,
  p_type text,
  p_description text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_data jsonb,
  p_summary text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_job_token(p_job_id, p_token) then
    raise exception 'invalid_token';
  end if;

  update public.jobs set
    type = coalesce(p_type, type),
    description = coalesce(p_description, description),
    city = coalesce(p_city, city),
    address = coalesce(p_address, address),
    postal_code = coalesce(p_postal_code, postal_code),
    summary = coalesce(p_summary, summary),
    submitted_at = now(),
    updated_at = now()
  where id = p_job_id;

  update public.job_data set
    data = data || coalesce(p_data, '{}'::jsonb),
    updated_at = now()
  where job_id = p_job_id;
end;
$$;

grant execute on function public.submit_job_data(uuid, uuid, text, text, text, text, text, jsonb, text) to anon, authenticated;
