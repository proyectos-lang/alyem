-- ============================================================================
-- Campo DUCA T: bandera que decide si se piden Razón social / RTN / Kilos /
-- Bultos / Números de factura (DUCA T) en el paso "Envío a aforo y digital".
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table gestiones add column if not exists duca_t boolean;
