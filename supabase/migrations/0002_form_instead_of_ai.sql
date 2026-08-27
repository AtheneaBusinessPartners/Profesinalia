-- ClimaAssist — sustituye el chat de IA por un formulario de desplegables.
-- Aplica esto DESPUÉS de 0001_init.sql, sobre una base de datos que ya lo tenga.

-- 1) Storage: quitamos la policy de insert que dependía de is_valid_conversation_token
drop policy if exists "job_photos_public_insert" on storage.objects;

-- 2) Quitamos la relación jobs -> conversations (ya no hay conversación, es un formulario)
alter table public.jobs drop column if exists conversation_id;

drop table if exists public.messages;
drop table if exists public.conversations;

-- 3) Renombramos ai_summary -> summary (ya no lo genera una IA)
alter table public.jobs rename column ai_summary to summary;

-- 4) Añadimos un token de acceso propio a cada job (sustituye al de conversations)
alter table public.jobs add column if not exists access_token uuid not null default gen_random_uuid();
alter table public.jobs add constraint jobs_access_token_key unique (access_token);

-- 5) Funciones antiguas del flujo de chat: ya no se usan
drop function if exists public.get_conversation_messages(uuid, uuid);
drop function if exists public.post_customer_message(uuid, uuid, text);
drop function if exists public.post_ai_message(uuid, uuid, text);
drop function if exists public.update_job_from_ai(uuid, uuid, text, text, text, text, text, jsonb, text, boolean);
drop function if exists public.start_conversation(text, text, text);
drop function if exists public.is_valid_conversation_token(uuid, uuid);

-- 6) Nueva función de validación de token, ahora sobre jobs
create or replace function public.is_valid_job_token(p_job_id uuid, p_token uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.jobs where id = p_job_id and access_token = p_token
  );
$$;

grant execute on function public.is_valid_job_token(uuid, uuid) to anon, authenticated;

-- 7) Arranca la solicitud pública: busca/crea cliente por teléfono y crea el job en borrador.
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
begin
  select * into v_business from public.businesses where slug = p_slug;
  if v_business.id is null then
    raise exception 'business_not_found';
  end if;

  select id into v_customer_id from public.customers
    where business_id = v_business.id and phone = p_customer_phone;

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

-- 8) Guarda las respuestas del formulario (se puede llamar varias veces mientras el cliente rellena)
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
    updated_at = now()
  where id = p_job_id;

  update public.job_data set
    data = data || coalesce(p_data, '{}'::jsonb),
    updated_at = now()
  where job_id = p_job_id;
end;
$$;

grant execute on function public.submit_job_data(uuid, uuid, text, text, text, text, text, jsonb, text) to anon, authenticated;

-- 9) register_job_photo: misma firma que antes, ahora el primer parámetro es el job_id
-- (hay que borrarla antes: Postgres no permite renombrar un parámetro con CREATE OR REPLACE)
drop function if exists public.register_job_photo(uuid, uuid, text);

create function public.register_job_photo(
  p_job_id uuid,
  p_token uuid,
  p_url text
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

  insert into public.job_photos (job_id, url) values (p_job_id, p_url);
end;
$$;

grant execute on function public.register_job_photo(uuid, uuid, text) to anon, authenticated;

-- 10) Recreamos la policy de subida de fotos, ahora sobre carpetas {job_id}/{token}/...
create policy "job_photos_public_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'job-photos'
    and public.is_valid_job_token(
      (storage.foldername(name))[1]::uuid,
      (storage.foldername(name))[2]::uuid
    )
  );
