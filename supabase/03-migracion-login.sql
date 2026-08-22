-- Migración: login básico. Ejecutar UNA vez en un proyecto ya sembrado
-- (no destructiva). Agrega la columna password y fija contraseñas del demo.
set search_path to aylem;

alter table usuarios add column if not exists password text;

update usuarios set password = 'admin123'  where email = 'admin@agenciaduanera.hn';
update usuarios set password = 'carlos123' where email = 'carlos@agenciaduanera.hn';
update usuarios set password = 'diana123'  where email = 'diana@agenciaduanera.hn';
update usuarios set password = 'luis123'   where email = 'luis@importadoravalle.hn';
update usuarios set password = 'maria123'  where email = 'maria@importadoravalle.hn';
update usuarios set password = 'jorge123'  where email = 'jorge@comercialpacifico.hn';
