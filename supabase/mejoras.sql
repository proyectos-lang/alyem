-- ============================================================================
-- Mejoras operativas + bitácora de auditoría — Alyem Customs (esquema aylem)
-- Ejecuta este script UNA vez en el SQL Editor de Supabase. Es idempotente y
-- no destructivo (usa "if not exists" / "or replace").
-- ============================================================================
set search_path to aylem;

-- 1) SLA objetivo por etapa -------------------------------------------------
alter table estados_catalogo add column if not exists sla_dias int;

-- 2) Umbral configurable de alerta de días libres ---------------------------
insert into configuracion (clave, valor, descripcion)
values ('dias_alerta_libres', '3', 'Días restantes para alertar por vencimiento de días libres')
on conflict (clave) do nothing;

-- 3) Reportes programados (definiciones guardadas + historial de generación) -
create table if not exists reportes_definiciones (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  cols         text[] not null default '{}',
  empresa_id   uuid references empresas(id) on delete set null,
  base         text not null default 'eta',
  desde        date,
  hasta        date,
  periodicidad text not null default 'manual',   -- etiqueta informativa (sin cron)
  creado_por   uuid references usuarios(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists reportes_instantaneas (
  id           uuid primary key default gen_random_uuid(),
  definicion_id uuid references reportes_definiciones(id) on delete cascade,
  generado_por uuid references usuarios(id) on delete set null,
  filas        int,
  created_at   timestamptz not null default now()
);

-- 4) Bitácora de auditoría genérica -----------------------------------------
create table if not exists auditoria (
  id            bigint generated always as identity primary key,
  tabla         text not null,
  operacion     text not null,           -- INSERT | UPDATE | DELETE
  registro_id   text,
  usuario_id    uuid,
  datos_antes   jsonb,
  datos_despues jsonb,
  cambios       jsonb,                   -- columnas que cambiaron (solo UPDATE)
  creado        timestamptz not null default now()
);
create index if not exists idx_auditoria_tabla on auditoria (tabla);
create index if not exists idx_auditoria_creado on auditoria (creado desc);
create index if not exists idx_auditoria_usuario on auditoria (usuario_id);

-- Función de trigger genérica: registra INSERT/UPDATE/DELETE de cualquier tabla.
create or replace function fn_auditoria() returns trigger
language plpgsql security definer set search_path = aylem as $$
declare
  v_antes   jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_despues jsonb := case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end;
  v_fuente  jsonb := coalesce(v_despues, v_antes);
  v_cambios jsonb := '{}'::jsonb;
  v_actor   uuid;
  k text;
begin
  -- Actor: primera columna de usuario presente en la fila.
  v_actor := coalesce(
    (v_fuente->>'usuario_id')::uuid,
    (v_fuente->>'subido_por')::uuid,
    (v_fuente->>'operador_id')::uuid,
    (v_fuente->>'creado_por')::uuid,
    (v_fuente->>'generado_por')::uuid
  );

  -- Diferencias en UPDATE.
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_despues) loop
      if v_despues->k is distinct from v_antes->k then
        v_cambios := v_cambios || jsonb_build_object(k, jsonb_build_object('antes', v_antes->k, 'despues', v_despues->k));
      end if;
    end loop;
    -- Si nada cambió realmente, no registra ruido.
    if v_cambios = '{}'::jsonb then return null; end if;
  end if;

  insert into auditoria (tabla, operacion, registro_id, usuario_id, datos_antes, datos_despues, cambios)
  values (
    tg_table_name,
    tg_op,
    coalesce(v_fuente->>'id', v_fuente->>'clave'),
    v_actor,
    v_antes,
    v_despues,
    case when tg_op = 'UPDATE' then v_cambios else null end
  );
  return null;
end;
$$;

-- Adjunta el trigger a TODAS las tablas del esquema (excepto la propia auditoría).
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'aylem' and tablename <> 'auditoria'
  loop
    execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
    execute format(
      'create trigger trg_auditoria after insert or update or delete on aylem.%I
       for each row execute function aylem.fn_auditoria();', t);
  end loop;
end $$;

-- Para revertir la auditoría:
--   do $$ declare t text; begin
--     for t in select tablename from pg_tables where schemaname='aylem' loop
--       execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
--     end loop; end $$;
--   drop function if exists fn_auditoria();  drop table if exists auditoria;
