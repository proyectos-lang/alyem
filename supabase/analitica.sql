-- ============================================================================
-- Analítica + Satisfacción ampliada + Régimen aduanero — Alyem Customs (aylem)
-- Ejecuta este script UNA vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- 1) Satisfacción: 4 dimensiones nuevas (llegamos a 7 ítems) --------------------
alter table calificaciones add column if not exists dim_documentacion int check (dim_documentacion between 1 and 5);
alter table calificaciones add column if not exists dim_resolucion   int check (dim_resolucion   between 1 and 5);
alter table calificaciones add column if not exists dim_atencion     int check (dim_atencion     between 1 and 5);
alter table calificaciones add column if not exists dim_valor        int check (dim_valor        between 1 and 5);

-- 2) Régimen aduanero: catálogo + FK en gestiones ------------------------------
create table if not exists regimenes (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null,
  orden   int  not null default 0,
  activo  boolean not null default true
);

alter table gestiones add column if not exists regimen_id uuid references regimenes(id) on delete set null;

insert into regimenes (nombre, orden)
select * from (values
  ('Importación definitiva', 1),
  ('Importación temporal', 2),
  ('Reexportación', 3),
  ('Depósito aduanero', 4),
  ('Tránsito aduanero', 5),
  ('Exportación definitiva', 6),
  ('Régimen especial / Zona libre', 7)
) as v(nombre, orden)
where not exists (select 1 from regimenes);

-- 3) Auditoría de las tablas nuevas (adjunta el trigger si ya corriste mejoras.sql).
do $$
declare t text;
begin
  -- Solo si la infraestructura de auditoría existe.
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables where schemaname = 'aylem' and tablename <> 'auditoria'
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
