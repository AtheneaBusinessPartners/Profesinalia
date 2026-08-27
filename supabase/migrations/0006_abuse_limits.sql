-- Frenos básicos de abuso para el formulario público, sin captcha ni
-- servicios externos: límites en el bucket de fotos + límites de volumen
-- en la creación de solicitudes (por teléfono y por negocio).

-- 1) El bucket de fotos ya no acepta cualquier tamaño o tipo de archivo.
update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'job-photos';

-- 2) start_job_request ahora rechaza volúmenes anómalos:
--    - más de 3 solicitudes del mismo teléfono en la última hora (cualquier negocio)
--    - más de 20 solicitudes nuevas para el mismo negocio en los últimos 10 minutos
create or replace function public.start_job_request(
  p_slug text,
  p_customer_name text,
  p_customer_phone text
)
returns table (
  job_id uuid,
  token uuid,
  business_id uuid,
  business_name text,
  is_returning_customer boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_customer_id uuid;
  v_returning boolean := false;
  v_job_id uuid;
  v_token uuid;
  v_phone_jobs_last_hour integer;
  v_business_jobs_last_10min integer;
begin
  select * into v_business from public.businesses where slug = p_slug;
  if v_business.id is null then
    raise exception 'business_not_found';
  end if;

  select count(*) into v_phone_jobs_last_hour
    from public.jobs j
    join public.customers c on c.id = j.customer_id
    where c.phone = p_customer_phone and j.created_at > now() - interval '1 hour';

  if v_phone_jobs_last_hour >= 3 then
    raise exception 'rate_limited';
  end if;

  select count(*) into v_business_jobs_last_10min
    from public.jobs j
    where j.business_id = v_business.id and j.created_at > now() - interval '10 minutes';

  if v_business_jobs_last_10min >= 20 then
    raise exception 'rate_limited';
  end if;

  select id into v_customer_id from public.customers c
    where c.business_id = v_business.id and c.phone = p_customer_phone;

  if v_customer_id is null then
    insert into public.customers (business_id, name, phone)
    values (v_business.id, p_customer_name, p_customer_phone)
    returning id into v_customer_id;
  else
    v_returning := true;
    update public.customers set name = p_customer_name where id = v_customer_id and name <> p_customer_name;
  end if;

  insert into public.jobs (business_id, customer_id)
  values (v_business.id, v_customer_id)
  returning id, access_token into v_job_id, v_token;

  insert into public.job_data (job_id, data) values (v_job_id, '{}'::jsonb);

  return query select v_job_id, v_token, v_business.id, v_business.name, v_returning;
end;
$$;

grant execute on function public.start_job_request(text, text, text) to anon, authenticated;
