-- ============================================================================
-- "Mi espacio": tabla de control personal por coordinador (operador) / admin.
-- Cada fila = una operación; columnas personalizables por usuario; valores en
-- jsonb por operación. Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Columnas personalizadas que define cada coordinador.
create table if not exists mi_espacio_columnas (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  clave      text not null,                 -- llave estable dentro del jsonb de valores
  label      text not null,
  tipo       text not null default 'text',  -- text | num | date | bool | select
  opciones   jsonb,                          -- para tipo select
  orden      int  not null default 0,
  created_at timestamptz not null default now(),
  unique (usuario_id, clave)
);
create index if not exists idx_mi_espacio_columnas_usuario on mi_espacio_columnas (usuario_id);

-- Valores por operación (bolsa jsonb keyed por clave de columna), por coordinador.
create table if not exists mi_espacio_valores (
  usuario_id uuid not null references usuarios(id) on delete cascade,
  gestion_id uuid not null references gestiones(id) on delete cascade,
  valores    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (usuario_id, gestion_id)
);

-- (Re)adjunta el trigger de auditoría a las tablas del esquema (incluidas las nuevas).
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem' and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
