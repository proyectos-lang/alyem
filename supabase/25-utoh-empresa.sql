-- ============================================================================
-- Permiso de UTOH por empresa/cliente: número, fecha de vencimiento y documento
-- adjunto (ruta en el bucket privado de adjuntos). Ejecuta una vez en el SQL
-- Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table empresas add column if not exists utoh_numero text;
alter table empresas add column if not exists utoh_vencimiento date;
alter table empresas add column if not exists utoh_doc_path text;
