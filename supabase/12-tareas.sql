-- ============================================================================
-- Tareas operativas: escalamiento de SLA por etapa + resumen diario.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Evita re-escalar la misma operación en la misma etapa.
create table if not exists sla_escalamientos (
  id         bigint generated always as identity primary key,
  gestion_id uuid references gestiones(id) on delete cascade,
  estado_id  uuid references estados_catalogo(id) on delete cascade,
  creado     timestamptz not null default now(),
  unique (gestion_id, estado_id)
);

-- Instantánea del resumen diario (para historial).
create table if not exists resumenes_diarios (
  fecha  date primary key,
  datos  jsonb not null,
  creado timestamptz not null default now()
);

-- (Re)adjunta auditoría a tablas nuevas; excluye tablas de log para no hacer ruido.
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem'
               and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
