-- Migración: métricas de operación (Valor CIF y Peso). Ejecutar UNA vez.
-- No destructiva. Agrega las columnas y fija valores de ejemplo por gestión.
set search_path to aylem;

alter table gestiones add column if not exists valor_cif numeric;
alter table gestiones add column if not exists peso_kg   numeric;

update gestiones set valor_cif = 1284500, peso_kg = 12450 where referencia = 'GES-2026-0001';
update gestiones set valor_cif =  345800, peso_kg =   820 where referencia = 'GES-2026-0002';
update gestiones set valor_cif =  978000, peso_kg =  9600 where referencia = 'GES-2026-0003';
update gestiones set valor_cif =  512300, peso_kg =  6400 where referencia = 'GES-2026-0004';
