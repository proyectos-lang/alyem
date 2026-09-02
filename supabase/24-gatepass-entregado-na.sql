-- ============================================================================
-- "Gatepass entregado" (paso 12) pasa de boolean a texto para permitir 3 opciones
-- explícitas: 'si' | 'no' | 'na'. Ejecuta una vez en el SQL Editor. Idempotente
-- (solo convierte si la columna sigue siendo boolean).
-- ============================================================================
set search_path to aylem;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'aylem' and table_name = 'gestiones'
      and column_name = 'gatepass_entregado' and data_type = 'boolean'
  ) then
    alter table gestiones
      alter column gatepass_entregado type text
      using (case when gatepass_entregado is true then 'si'
                  when gatepass_entregado is false then 'no'
                  else null end);
  end if;
end $$;
