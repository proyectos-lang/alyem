-- ============================================================================
-- Asignación de clientes (empresas) a operadores. Ejecuta una vez en Supabase.
-- Un operador solo verá las operaciones de sus clientes asignados. Sin
-- asignaciones = ve todas (retrocompatible). Muchos-a-muchos.
-- ============================================================================
set search_path to aylem;

create table if not exists operador_empresas (
  usuario_id uuid not null references usuarios(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  primary key (usuario_id, empresa_id)
);
create index if not exists idx_operador_empresas_empresa on operador_empresas (empresa_id);

-- (Re)adjunta el trigger de auditoría a las tablas del esquema (incluida la nueva).
do $$
declare t text;
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'aylem' and p.proname = 'fn_auditoria') then
    for t in select tablename from pg_tables
             where schemaname = 'aylem' and tablename not in ('auditoria','auditoria_sesiones','sla_escalamientos','resumenes_diarios')
    loop
      execute format('drop trigger if exists trg_auditoria on aylem.%I;', t);
      execute format(
        'create trigger trg_auditoria after insert or update or delete on aylem.%I
         for each row execute function aylem.fn_auditoria();', t);
    end loop;
  end if;
end $$;
