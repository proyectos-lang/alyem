-- ============================================================================
-- Tipos de operación nuevos para los flujos por tipo (Fase 2).
-- Amplía el enum tipo_operacion. Idempotente (add value if not exists).
-- NOTA: un valor de enum recién agregado no se puede USAR en la misma
-- transacción; este script solo agrega los valores (no los usa), así que es
-- seguro. Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================================
set search_path to aylem;

alter type tipo_operacion add value if not exists 'exportacion_temporal';
alter type tipo_operacion add value if not exists 'exportacion_definitiva';
alter type tipo_operacion add value if not exists 'duca_f_importacion';
alter type tipo_operacion add value if not exists 'duca_f_exportacion';
alter type tipo_operacion add value if not exists 'fyduca';

-- El valor 'duca_f' existente se conserva como genérico (operaciones ya cargadas
-- lo mantienen). Los nuevos flujos usan duca_f_importacion / duca_f_exportacion.
