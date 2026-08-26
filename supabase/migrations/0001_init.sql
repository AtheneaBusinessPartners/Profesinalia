-- ClimaAssist — esquema inicial (MVP)
-- USER -> BUSINESS -> DATA

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (una fila por usuario autenticado: el profesional)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'pro' check (role in ('pro', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- Crea automáticamente el profile al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. BUSINESSES
-- ============================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null,
  slug text not null unique,
  description text not null default 'Instalación y reparación de aire acondicionado.',
  phone text not null default '',
  email text not null default '',
  zone text not null default '',
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create index businesses_owner_id_idx on public.businesses(owner_id);

-- Lectura pública mínima necesaria para /c/[slug] (no expone datos económicos, viven en otra tabla)
create policy "businesses_public_select"
  on public.businesses for select
  using (true);

create policy "businesses_owner_update"
  on public.businesses for update
  using (owner_id = auth.uid());

create policy "businesses_owner_insert"
  on public.businesses for insert
  with check (owner_id = auth.uid());

-- ============================================================
-- 3. CUSTOMERS
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (business_id, phone)
);

alter table public.customers enable row level security;

create index customers_business_id_idx on public.customers(business_id);

create policy "customers_owner_select"
  on public.customers for select
  using (
    public.is_admin()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- No hay policy de insert/update directa: los clientes se crean solo vía función security definer
-- (start_conversation), porque el visitante público no tiene sesión de Supabase Auth.

-- ============================================================
-- 4. CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  access_token uuid not null default gen_random_uuid(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create index conversations_business_id_idx on public.conversations(business_id);

create policy "conversations_owner_select"
  on public.conversations for select
  using (
    public.is_admin()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- ============================================================
-- 5. MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('customer', 'ai')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create index messages_conversation_id_idx on public.messages(conversation_id);

create policy "messages_owner_select"
  on public.messages for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      join public.businesses b on b.id = c.business_id
      where c.id = conversation_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. JOBS (la "solicitud" / trabajo)
-- ============================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade unique,
  type text,
  status text not null default 'nueva' check (status in (
    'nueva', 'en_revision', 'presupuesto_enviado', 'aceptada', 'en_curso', 'completada', 'rechazada', 'cancelada'
  )),
  address text,
  city text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  description text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create index jobs_business_id_idx on public.jobs(business_id);
create index jobs_customer_id_idx on public.jobs(customer_id);

create policy "jobs_owner_select"
  on public.jobs for select
  using (
    public.is_admin()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "jobs_owner_update"
  on public.jobs for update
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- ============================================================
-- 7. JOB_DATA (información técnica recopilada por la IA, JSONB)
-- ============================================================
create table public.job_data (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.job_data enable row level security;

create policy "job_data_owner_select"
  on public.job_data for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.jobs j join public.businesses b on b.id = j.business_id
      where j.id = job_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 8. JOB_PHOTOS
-- ============================================================
create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.job_photos enable row level security;

create index job_photos_job_id_idx on public.job_photos(job_id);

create policy "job_photos_owner_select"
  on public.job_photos for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.jobs j join public.businesses b on b.id = j.business_id
      where j.id = job_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 9. JOB_FINANCIALS (privado, solo profesional/admin)
-- ============================================================
create table public.job_financials (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  sale_price numeric(10,2) not null default 0,
  material_cost numeric(10,2) not null default 0,
  labor_cost numeric(10,2) not null default 0,
  travel_cost numeric(10,2) not null default 0,
  other_costs numeric(10,2) not null default 0,
  total_cost numeric(10,2) generated always as (material_cost + labor_cost + travel_cost + other_costs) stored,
  profit numeric(10,2) generated always as (sale_price - (material_cost + labor_cost + travel_cost + other_costs)) stored,
  margin numeric(6,2) generated always as (
    case when sale_price > 0
      then round(((sale_price - (material_cost + labor_cost + travel_cost + other_costs)) / sale_price) * 100, 2)
      else 0
    end
  ) stored,
  updated_at timestamptz not null default now()
);

alter table public.job_financials enable row level security;

create policy "job_financials_owner_all"
  on public.job_financials for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.jobs j join public.businesses b on b.id = j.business_id
      where j.id = job_id and b.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.jobs j join public.businesses b on b.id = j.business_id
      where j.id = job_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 10. FUNCIONES SECURITY DEFINER para el flujo público (cliente anónimo)
-- Único camino de escritura para visitantes sin sesión de Supabase Auth.
-- ============================================================

-- Valida que (conversation_id, token) sea una pareja correcta. Se usa también desde Storage.
create or replace function public.is_valid_conversation_token(p_conversation_id uuid, p_token uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversations
    where id = p_conversation_id and access_token = p_token
  );
$$;

-- Arranca la conversación pública: busca/crea cliente por teléfono, crea conversación y job en borrador.
create or replace function public.start_conversation(
  p_slug text,
  p_customer_name text,
  p_customer_phone text
)
returns table (
  conversation_id uuid,
  token uuid,
  job_id uuid,
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
  v_conversation_id uuid;
  v_token uuid;
  v_job_id uuid;
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

  insert into public.conversations (business_id, customer_id)
  values (v_business.id, v_customer_id)
  returning id, access_token into v_conversation_id, v_token;

  insert into public.jobs (business_id, customer_id, conversation_id)
  values (v_business.id, v_customer_id, v_conversation_id)
  returning id into v_job_id;

  insert into public.job_data (job_id, data) values (v_job_id, '{}'::jsonb);

  insert into public.messages (conversation_id, sender, content)
  values (
    v_conversation_id,
    'ai',
    'Hola ' || split_part(p_customer_name, ' ', 1) || ' 👋' || chr(10) ||
    'Soy el asistente de ' || v_business.name || '. Voy a hacerte unas preguntas para que pueda entender qué necesitas y valorar el trabajo.' || chr(10) ||
    '¿Qué necesitas exactamente?'
  );

  return query select v_conversation_id, v_token, v_job_id, v_business.id, v_business.name, v_returning;
end;
$$;

grant execute on function public.start_conversation(text, text, text) to anon, authenticated;
grant execute on function public.is_valid_conversation_token(uuid, uuid) to anon, authenticated;

-- Inserta un mensaje del cliente (requiere token válido)
create or replace function public.post_customer_message(
  p_conversation_id uuid,
  p_token uuid,
  p_content text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_conversation_token(p_conversation_id, p_token) then
    raise exception 'invalid_token';
  end if;

  insert into public.messages (conversation_id, sender, content)
  values (p_conversation_id, 'customer', p_content);
end;
$$;

grant execute on function public.post_customer_message(uuid, uuid, text) to anon, authenticated;

-- Inserta un mensaje de la IA (lo llama el backend, tras generar la respuesta)
create or replace function public.post_ai_message(
  p_conversation_id uuid,
  p_token uuid,
  p_content text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_conversation_token(p_conversation_id, p_token) then
    raise exception 'invalid_token';
  end if;

  insert into public.messages (conversation_id, sender, content)
  values (p_conversation_id, 'ai', p_content);
end;
$$;

grant execute on function public.post_ai_message(uuid, uuid, text) to anon, authenticated;

-- Lee el historial de una conversación (para reconstruir el contexto que se manda a la IA)
create or replace function public.get_conversation_messages(
  p_conversation_id uuid,
  p_token uuid
)
returns table (sender text, content text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_valid_conversation_token(p_conversation_id, p_token) then
    raise exception 'invalid_token';
  end if;

  return query
    select m.sender, m.content, m.created_at
    from public.messages m
    where m.conversation_id = p_conversation_id
    order by m.created_at asc;
end;
$$;

grant execute on function public.get_conversation_messages(uuid, uuid) to anon, authenticated;

-- Actualiza la información del trabajo recopilada por la IA. Si p_complete es true, cierra la conversación.
create or replace function public.update_job_from_ai(
  p_conversation_id uuid,
  p_token uuid,
  p_type text,
  p_description text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_data jsonb,
  p_ai_summary text,
  p_complete boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  if not public.is_valid_conversation_token(p_conversation_id, p_token) then
    raise exception 'invalid_token';
  end if;

  select id into v_job_id from public.jobs where conversation_id = p_conversation_id;

  update public.jobs set
    type = coalesce(p_type, type),
    description = coalesce(p_description, description),
    city = coalesce(p_city, city),
    address = coalesce(p_address, address),
    postal_code = coalesce(p_postal_code, postal_code),
    ai_summary = coalesce(p_ai_summary, ai_summary),
    updated_at = now()
  where id = v_job_id;

  update public.job_data set
    data = data || coalesce(p_data, '{}'::jsonb),
    updated_at = now()
  where job_id = v_job_id;

  if p_complete then
    update public.conversations set completed_at = now() where id = p_conversation_id;
  end if;
end;
$$;

grant execute on function public.update_job_from_ai(uuid, uuid, text, text, text, text, text, jsonb, text, boolean) to anon, authenticated;

-- Registra una fotografía subida a Storage por el cliente anónimo
create or replace function public.register_job_photo(
  p_conversation_id uuid,
  p_token uuid,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  if not public.is_valid_conversation_token(p_conversation_id, p_token) then
    raise exception 'invalid_token';
  end if;

  select id into v_job_id from public.jobs where conversation_id = p_conversation_id;

  insert into public.job_photos (job_id, url) values (v_job_id, p_url);
end;
$$;

grant execute on function public.register_job_photo(uuid, uuid, text) to anon, authenticated;

-- Lectura pública mínima del negocio para la página /c/[slug]
create or replace function public.get_public_business(p_slug text)
returns table (id uuid, name text, description text, zone text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, description, zone from public.businesses where slug = p_slug;
$$;

grant execute on function public.get_public_business(text) to anon, authenticated;

-- ============================================================
-- 11. STORAGE: bucket para fotografías de trabajos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

-- El cliente anónimo solo puede subir dentro de una carpeta {conversation_id}/{token}/...
-- validada contra la conversación real (evita subidas arbitrarias al bucket).
create policy "job_photos_public_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'job-photos'
    and public.is_valid_conversation_token(
      (storage.foldername(name))[1]::uuid,
      (storage.foldername(name))[2]::uuid
    )
  );

create policy "job_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'job-photos');

-- ============================================================
-- 12. Trigger genérico updated_at para jobs
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();
