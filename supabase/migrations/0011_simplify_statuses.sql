-- Simplifica los 8 estados de un trabajo a 4, mucho más manejables en el
-- día a día: nueva, en_curso, completada, cancelada.
-- en_revision, presupuesto_enviado y aceptada pasan a "en_curso".
-- rechazada pasa a "cancelada".

update public.jobs set status = 'en_curso' where status in ('en_revision', 'presupuesto_enviado', 'aceptada');
update public.jobs set status = 'cancelada' where status = 'rechazada';

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('nueva', 'en_curso', 'completada', 'cancelada'));
