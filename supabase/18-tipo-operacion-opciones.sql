-- ============================================================================
-- Nuevas opciones de tipo de operación: DUCA F y Tránsito Rápido.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter type tipo_operacion add value if not exists 'duca_f';
alter type tipo_operacion add value if not exists 'transito_rapido';
