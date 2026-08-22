-- Migración: login por nombre de usuario (no correo). Ejecutar UNA vez.
-- No destructiva. Agrega la columna 'usuario', la llena y hace opcional el correo.
set search_path to aylem;

alter table usuarios add column if not exists usuario text;

update usuarios set usuario = 'admin'  where email = 'admin@agenciaduanera.hn';
update usuarios set usuario = 'carlos' where email = 'carlos@agenciaduanera.hn';
update usuarios set usuario = 'diana'  where email = 'diana@agenciaduanera.hn';
update usuarios set usuario = 'luis'   where email = 'luis@importadoravalle.hn';
update usuarios set usuario = 'maria'  where email = 'maria@importadoravalle.hn';
update usuarios set usuario = 'jorge'  where email = 'jorge@comercialpacifico.hn';

-- El correo pasa a ser opcional; el usuario es único.
alter table usuarios alter column email drop not null;
create unique index if not exists usuarios_usuario_key on usuarios (usuario);
