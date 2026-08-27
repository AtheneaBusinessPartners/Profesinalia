-- La migración anterior (0008) añadió jobs.submitted_at, pero las
-- solicitudes que ya se habían completado de verdad ANTES de ese cambio
-- se quedaron con submitted_at vacío (la columna no existía cuando se
-- completaron), así que desaparecieron de las listas del profesional
-- aunque su facturación siguiera contando. Las recuperamos: cualquier
-- job que tenga un "type" guardado es porque el cliente llegó a pulsar
-- "Enviar solicitud" en su momento.

update public.jobs
set submitted_at = coalesce(updated_at, created_at)
where submitted_at is null and type is not null;
