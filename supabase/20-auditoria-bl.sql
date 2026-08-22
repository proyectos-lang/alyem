-- ============================================================================
-- Auditoría: referenciar el BL de la operación en cada movimiento (trazabilidad).
-- La fila de gestiones trae el BL (carta_porte); las filas con gestion_id
-- (eventos, documentos, etc.) lo resuelven contra gestiones. Si no hay BL aún,
-- se usa la referencia de la operación.
-- Basada en la versión vigente de fn_auditoria (que también captura la IP).
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table auditoria add column if not exists bl text;

create or replace function fn_auditoria() returns trigger
language plpgsql security definer set search_path = aylem as $$
declare
  v_antes   jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_despues jsonb := case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end;
  v_fuente  jsonb := coalesce(v_despues, v_antes);
  v_cambios jsonb := '{}'::jsonb;
  v_actor   uuid;
  v_ip      text;
  v_bl      text;
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
  -- IP del actor (último inicio de sesión).
  if v_actor is not null then
    select ultima_ip into v_ip from aylem.usuarios where id = v_actor;
  end if;

  -- BL de la operación relacionada (para trazabilidad).
  if v_fuente ? 'carta_porte' then
    -- La fila es de gestiones: su BL (o la referencia si el BL está pendiente).
    v_bl := coalesce(nullif(v_fuente->>'carta_porte',''), v_fuente->>'referencia');
  elsif nullif(v_fuente->>'gestion_id','') is not null then
    select coalesce(nullif(g.carta_porte,''), g.referencia)
    into v_bl from aylem.gestiones g where g.id = (v_fuente->>'gestion_id')::uuid;
  end if;

  -- Diferencias en UPDATE.
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_despues) loop
      if v_despues->k is distinct from v_antes->k then
        v_cambios := v_cambios || jsonb_build_object(k, jsonb_build_object('antes', v_antes->k, 'despues', v_despues->k));
      end if;
    end loop;
    if v_cambios = '{}'::jsonb then return null; end if;
  end if;

  insert into auditoria (tabla, operacion, registro_id, usuario_id, ip, datos_antes, datos_despues, cambios, bl)
  values (
    tg_table_name, tg_op,
    coalesce(v_fuente->>'id', v_fuente->>'clave'),
    v_actor, v_ip, v_antes, v_despues,
    case when tg_op = 'UPDATE' then v_cambios else null end,
    v_bl
  );
  return null;
end;
$$;

-- Backfill de registros existentes ----------------------------------------------
-- Filas de gestiones: BL desde los datos guardados.
update auditoria a set bl = coalesce(
  nullif(a.datos_despues->>'carta_porte',''), nullif(a.datos_antes->>'carta_porte',''),
  a.datos_despues->>'referencia', a.datos_antes->>'referencia'
)
where a.bl is null and (a.datos_despues ? 'carta_porte' or a.datos_antes ? 'carta_porte');

-- Filas con gestion_id (eventos, documentos, etc.): BL desde la operación.
update auditoria a set bl = coalesce(nullif(g.carta_porte,''), g.referencia)
from aylem.gestiones g
where a.bl is null
  and (a.datos_despues->>'gestion_id' = g.id::text or a.datos_antes->>'gestion_id' = g.id::text);
