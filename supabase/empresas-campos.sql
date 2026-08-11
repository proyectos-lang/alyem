-- ============================================================================
-- Campos adicionales de empresa: Cuenta, Código SN, Teléfono 1.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table empresas add column if not exists cuenta      text;
alter table empresas add column if not exists codigo_sn   text;
alter table empresas add column if not exists telefono_1  text;
