-- ============================================================================
-- Nueva etapa "Revisión" después del Selectivo (posición 10). Las demás corren
-- una posición: Levante→11, Gatepass→12, Facturación→13, Cierre→14.
-- + columnas nuevas para los campos de las etapas de revisión/levante/gatepass.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Corre las etapas para abrir la posición 10 (de mayor a menor: evita colisiones).
update estados_catalogo set orden = 14 where nombre = 'Cierre del ciclo';
update estados_catalogo set orden = 13 where nombre = 'Facturación del servicio';
update estados_catalogo set orden = 12 where nombre = 'Entrega del gatepass';
update estados_catalogo set orden = 11 where nombre = 'Levante de aduana';

-- Nueva etapa "Revisión" en la posición 10.
insert into estados_catalogo (nombre, orden, color, notifica_cliente, tipo)
select 'Revisión', 10, '#0d9488', true, 'normal'
where not exists (select 1 from estados_catalogo where nombre = 'Revisión');

-- Columnas nuevas.
alter table gestiones add column if not exists fecha_revision                date;
alter table gestiones add column if not exists fecha_aprobacion_aduana        date;
alter table gestiones add column if not exists fecha_revision_opc             date;
alter table gestiones add column if not exists fecha_posicionamiento_equipos  date;
alter table gestiones add column if not exists fecha_levante                  date;
alter table gestiones add column if not exists gatepass_fecha_hora            timestamptz;
