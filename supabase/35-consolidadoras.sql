-- ============================================================================
-- Consolidadoras: una empresa puede marcarse como "consolidadora". Al crear una
-- operación a nombre de una consolidadora se captura el "cliente final" (texto),
-- que se muestra en la operación junto a la empresa consolidadora.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

-- Flag de consolidadora en la empresa.
alter table empresas add column if not exists es_consolidadora boolean not null default false;

-- Cliente final de la operación (solo se usa cuando la empresa es consolidadora).
alter table gestiones add column if not exists cliente_final text;
