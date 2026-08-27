-- Corrige un bug real detectado probando el flujo del cliente en producción:
-- start_job_request fallaba con "column reference business_id is ambiguous"
-- porque el nombre coincidía con una columna de salida de la función y con
-- una columna de la tabla customers. Se cualifica la columna con un alias.

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
