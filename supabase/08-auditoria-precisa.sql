-- Marca si la ubicación de la sesión es precisa (GPS/permiso del navegador)
-- o aproximada (por IP). Ejecuta una vez en el SQL Editor de Supabase.
set search_path to aylem;

alter table auditoria_sesiones add column if not exists precisa boolean not null default false;
