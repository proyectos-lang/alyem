-- ============================================================================
-- Logo de empresa (para el portal del cliente) + bucket público para servirlo.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
-- ============================================================================
set search_path to aylem;

alter table empresas add column if not exists logo_url text;

-- Bucket público donde se guardan los logos (lectura pública; subida por el servidor).
insert into storage.buckets (id, name, public)
values ('alyem-logos', 'alyem-logos', true)
on conflict (id) do nothing;
