-- ============================================================================
-- Estados nuevos para los flujos por tipo de operación (Fase 4, Opción A).
-- SOLO inserts idempotentes (where not exists). NO ejecuta ningún update, rename
-- ni delete sobre estados_catalogo, gestiones ni eventos: las operaciones y su
-- histórico quedan INTACTOS. Los estados nuevos usan orden >= 100 para no
-- renumerar los 14 estados actuales; la secuencia real de cada tipo la define el
-- motor de flujo (lib/pasos.ts), no el orden global.
-- Ejecutar una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

insert into estados_catalogo (nombre, orden, color, notifica_cliente, tipo)
select v.nombre, v.orden, v.color, true, 'normal'
from (values
  ('Despacho de la carga',               101, '#84cc16'),  -- variante gatepass (DUCA F Importación)
  ('Plazo de vencimiento',               102, '#f59e0b'),  -- variante Envío del boletín (Exportación temporal)
  ('Confirmación de despacho de frontera', 103, '#22c55e'), -- variante gatepass (exportaciones/DUCA F)
  ('Número de FYDUCA',                   104, '#0ea5e9'),  -- variante Liquidación (FYDUCA)
  ('Pago de FYDUCA',                     105, '#10b981'),  -- variante Pago del boletín (FYDUCA)
  ('Número de mandamiento',              106, '#6366f1')   -- paso nuevo (DUCA F Exportación)
) as v(nombre, orden, color)
where not exists (select 1 from estados_catalogo e where e.nombre = v.nombre);

-- Re-adjuntar el trigger de auditoría (patrón idempotente de migraciones previas).
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
