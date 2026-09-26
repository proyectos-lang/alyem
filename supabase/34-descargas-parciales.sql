-- ============================================================================
-- Módulo "Descargas parciales" (régimen 7000, almacén fiscal).
-- Maestro-detalle independiente de gestiones: una cabecera (ingreso inicial de
-- una carga grande) con N descargos/retiros parciales. El saldo (cantidad_total
-- − Σ descargos) se calcula en la app.
-- Ejecutar una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Cabecera: el ingreso inicial de la carga a almacén fiscal.
create table if not exists descargas_cabecera (
  id             uuid primary key default gen_random_uuid(),
  referencia     text not null unique,               -- DP-YYYY-NNNN o el BL
  bl             text,                                -- número de Bill of Lading
  empresa_id     uuid not null references empresas(id),
  aduana_id      uuid references aduanas(id) on delete set null,
  regimen_id     uuid references regimenes(id) on delete set null,
  operador_id    uuid references usuarios(id),
  producto       text,
  cantidad_total numeric not null,                   -- carga total (admite decimales)
  unidad         text not null default 'toneladas',  -- toneladas | kilos | galones | unidades…
  fecha_ingreso  date,
  fecha_vencimiento date,                             -- plazo de almacén fiscal (hasta 1 año)
  observaciones  text,
  estado         text not null default 'abierta',    -- abierta | cerrada | cancelada
  created_at     timestamptz not null default now()
);
create index if not exists idx_descargas_cab_empresa on descargas_cabecera (empresa_id);
create index if not exists idx_descargas_cab_estado on descargas_cabecera (estado);

-- Descargos parciales: cada retiro de la carga. Hijos de la cabecera.
create table if not exists descargas_parciales (
  id                     uuid primary key default gen_random_uuid(),
  cabecera_id            uuid not null references descargas_cabecera(id) on delete cascade,
  cantidad               numeric not null,           -- cantidad retirada (misma unidad de la cabecera)
  correlativo_liquidacion text,                      -- número de declaración
  boletin_enviado        boolean,                    -- boletín emitido
  boletin_pagado         boolean,
  canal_selectivo        canal_selectividad,         -- verde | amarillo | rojo
  fecha                  date,
  observaciones          text,
  registrado_por         uuid references usuarios(id),
  created_at             timestamptz not null default now()
);
create index if not exists idx_descargas_parc_cab on descargas_parciales (cabecera_id, created_at desc);

-- Régimen "Almacén fiscal (7000)" (no existe en el seed). Insert idempotente.
insert into regimenes (nombre, orden, activo)
select 'Almacén fiscal (7000)', 100, true
where not exists (select 1 from regimenes where nombre = 'Almacén fiscal (7000)');

-- Anti-duplicado de la alerta de vencimiento (una fila por cabecera ya alertada).
create table if not exists alertas_vencimiento_descarga (
  cabecera_id uuid primary key references descargas_cabecera(id) on delete cascade,
  alertado_en timestamptz not null default now()
);

-- Re-adjuntar el trigger de auditoría a todas las tablas (incluye las nuevas de
-- descargas; se excluyen las tablas de log de alto volumen).
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem'
               and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios','tracking_consultas','alertas_vencimiento','alertas_vencimiento_descarga')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
