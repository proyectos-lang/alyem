-- Notificaciones en tiempo real (Supabase Realtime).
-- Ejecuta esto UNA vez en el SQL Editor de Supabase para que el navegador
-- reciba los INSERT de la tabla de notificaciones vía Realtime.

-- 1) Publica la tabla de notificaciones en la publicación de Realtime.
alter publication supabase_realtime add table aylem.notificaciones;

-- 2) REPLICA IDENTITY FULL: asegura que los filtros por columna (usuario_id)
--    funcionen en los eventos de Realtime.
alter table aylem.notificaciones replica identity full;

-- Nota: este proyecto no usa RLS (demo). Con RLS deshabilitado, Realtime
-- entrega los cambios a los clientes suscritos con la anon key.
-- Para revertir: alter publication supabase_realtime drop table aylem.notificaciones;
