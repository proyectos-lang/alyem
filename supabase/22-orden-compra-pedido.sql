-- ============================================================================
-- Números de orden de compra y de pedido en la operación (junto al BL).
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table gestiones add column if not exists numero_orden_compra text;
alter table gestiones add column if not exists numero_pedido text;
