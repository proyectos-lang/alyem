-- Ajustes al flujo de solicitud/recepción.
-- Ejecuta una vez en el SQL Editor de Supabase.
set search_path to aylem;

-- Observaciones al aceptar un documento (reemplaza el flujo de "rechazo").
alter table documentos add column if not exists observaciones text;
