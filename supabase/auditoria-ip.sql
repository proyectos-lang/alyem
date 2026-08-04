-- ============================================================================
-- Auditoría: IP por cambio + auditoría de inicios de sesión con ubicación.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- 1) IP en cada registro de la bitácora de cambios.
alter table auditoria add column if not exists ip text;

-- 2) IP y ubicación del último inicio de sesión por usuario (fuente de la IP
--    que el trigger asigna a cada cambio).
alter table usuarios add column if not exists ultima_ip     text;
alter table usuarios add column if not exists ultima_lat    double precision;
alter table usuarios add column if not exists ultima_lng    double precision;
alter table usuarios add column if not exists ultima_ciudad text;
alter table usuarios add column if not exists ultima_pais   text;

-- 3) Auditoría de inicios de sesión.
create table if not exists auditoria_sesiones (
  id         bigint generated always as identity primary key,
  usuario_id uuid references usuarios(id) on delete set null,
  ip         text,
  lat        double precision,
  lng        double precision,
  ciudad     text,
  pais       text,
  user_agent text,
  creado     timestamptz not null default now()
);
create index if not exists idx_sesiones_creado on auditoria_sesiones (creado desc);

-- 4) fn_auditoria actualizada: agrega la IP del actor (usuarios.ultima_ip).
create or replace function fn_auditoria() returns trigger
language plpgsql security definer set search_path = aylem as $$
declare
  v_antes   jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_despues jsonb := case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end;
  v_fuente  jsonb := coalesce(v_despues, v_antes);
  v_cambios jsonb := '{}'::jsonb;
  v_actor   uuid;
  v_ip      text;
  k text;
begin
  v_actor := coalesce(
    (v_fuente->>'usuario_id')::uuid,
    (v_fuente->>'subido_por')::uuid,
    (v_fuente->>'operador_id')::uuid,
    (v_fuente->>'creado_por')::uuid,
    (v_fuente->>'generado_por')::uuid
  );
  if v_actor is not null then
    select ultima_ip into v_ip from aylem.usuarios where id = v_actor;
  end if;

  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_despues) loop
      if v_despues->k is distinct from v_antes->k then
        v_cambios := v_cambios || jsonb_build_object(k, jsonb_build_object('antes', v_antes->k, 'despues', v_despues->k));
      end if;
    end loop;
    if v_cambios = '{}'::jsonb then return null; end if;
  end if;

  insert into auditoria (tabla, operacion, registro_id, usuario_id, ip, datos_antes, datos_despues, cambios)
  values (
    tg_table_name, tg_op,
    coalesce(v_fuente->>'id', v_fuente->>'clave'),
    v_actor, v_ip, v_antes, v_despues,
    case when tg_op = 'UPDATE' then v_cambios else null end
  );
  return null;
end;
$$;

-- 5) (Re)adjunta triggers; excluye las tablas de auditoría para no auto-auditar.
do $$
declare t text;
begin
  for t in select tablename from pg_tables
           where schemaname = 'aylem' and tablename not in ('auditoria', 'auditoria_sesiones')
  loop
    execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
    execute format(
      'create trigger trg_auditoria after insert or update or delete on aylem.%I
       for each row execute function aylem.fn_auditoria();', t);
  end loop;
end $$;
