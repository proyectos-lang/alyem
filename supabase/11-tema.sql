-- Preferencia de tema (claro/oscuro) por usuario.
-- Ejecuta una vez en el SQL Editor de Supabase.
set search_path to aylem;

alter table usuarios add column if not exists tema text;
