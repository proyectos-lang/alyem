-- ============================================================================
-- Tracking de contenedores por BL (JSONCargo). Histórico de consultas a la API
-- externa, por operación. Cada "Nueva consulta" agrega una fila; la app muestra
-- la más reciente por operación y permite pedir una nueva bajo demanda.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

create table if not exists tracking_consultas (
  id            uuid primary key default gen_random_uuid(),
  gestion_id    uuid references gestiones(id) on delete cascade,
  bl            text not null,                     -- BL consultado
  shipping_line text,                              -- línea usada en la API (ONE, MSC, …)
  consultado_por uuid references usuarios(id),     -- quién disparó la consulta
  ok            boolean not null default true,     -- la consulta trajo datos
  error         text,                              -- mensaje si falló
  -- Conteo de llamadas gastadas en esta consulta (1 del BL + N contenedores).
  llamadas      int not null default 0,
  -- Respuesta cruda de la API (BL + detalle de cada contenedor) para no perder nada.
  payload       jsonb,
  -- Campos clave extraídos (para mostrar/ordenar sin releer el jsonb).
  contenedores    int,                             -- nº de contenedores del BL
  estado          text,                            -- estado del 1er contenedor
  ubicacion       text,                            -- última ubicación
  proximo_destino text,
  puerto_carga    text,
  puerto_descarga text,
  origen          text,
  destino         text,
  vessel          text,                            -- buque actual o último
  atd_origen      timestamptz,                     -- salida del origen
  eta_destino     timestamptz,                     -- ETA destino final
  ultimo_movimiento timestamptz,
  api_last_updated  text,                          -- last_updated que reporta la API
  created_at    timestamptz not null default now()
);

create index if not exists idx_tracking_gestion on tracking_consultas (gestion_id, created_at desc);
create index if not exists idx_tracking_bl on tracking_consultas (bl);

-- No auditar esta tabla (es data externa, no editable por el usuario): se
-- reata el trigger a todas las tablas salvo las excluidas.
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem'
               and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios','tracking_consultas')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
