-- ============================================================================
-- Campos nuevos para los flujos por tipo de operación (Fase 3).
-- Todas las columnas son aditivas (add column if not exists); no alteran datos
-- existentes. Ejecutar una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Fechas de la cadena (exportaciones): ETD (fecha estimada de despacho) reemplaza
-- a ETA en varios tipos; fecha de vencimiento para exportación temporal.
alter table gestiones add column if not exists etd date;
alter table gestiones add column if not exists fecha_vencimiento date;

-- Aduana de salida (exportación definitiva usa salida en vez de ingreso).
alter table gestiones add column if not exists aduana_salida_id uuid references aduanas(id);

-- Permisos opcionales (exportación definitiva).
alter table gestiones add column if not exists permiso_sepa text;
alter table gestiones add column if not exists permiso_arsa text;
alter table gestiones add column if not exists permiso_banco_central text;

-- Número de mandamiento (DUCA F Exportación, si aplica) y número de FYDUCA.
alter table gestiones add column if not exists numero_mandamiento text;
alter table gestiones add column if not exists numero_fyduca text;

-- Confirmación de despacho de frontera (reemplaza al gatepass en exportaciones/
-- DUCA F): sí/no + fecha + observación.
alter table gestiones add column if not exists frontera_despachado boolean;
alter table gestiones add column if not exists frontera_fecha date;
alter table gestiones add column if not exists frontera_observacion text;

-- Banderas "¿aplica?" para pasos que en algunos tipos son opcionales (DUCA F
-- Exportación: aforo, boletín). Patrón tristate *_aplica (no bloquea si es No).
alter table gestiones add column if not exists aforo_aplica boolean;
alter table gestiones add column if not exists boletin_aplica boolean;

-- Anti-duplicado de la alerta de vencimiento (exportación temporal): una fila por
-- operación ya alertada, para no repetir la notificación en cada corrida del cron.
create table if not exists alertas_vencimiento (
  gestion_id uuid primary key references gestiones(id) on delete cascade,
  alertado_en timestamptz not null default now()
);

-- Re-adjuntar el trigger de auditoría a todas las tablas (por si el motor de
-- auditoría se dispara por columnas; patrón idempotente de migraciones previas).
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem'
               and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios','tracking_consultas','alertas_vencimiento')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
