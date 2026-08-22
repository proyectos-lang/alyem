-- ============================================================================
-- Perfil "Cliente aduanero" (sub-agencia): un cliente de Alyem que es a su vez
-- agente aduanero, con sus propios clientes finales. Ve solo su subárbol; Alyem
-- ve todo y reconoce sus operaciones por la marca diferencial.
-- Ejecuta una vez en el SQL Editor de Supabase. Idempotente.
--
-- NOTA: el `alter type ... add value` no puede USARSE en la misma transacción en
-- que se agrega. Este script solo lo agrega (no lo usa), así que corre completo.
-- ============================================================================
set search_path to aylem;

-- 1) Nuevo rol.
alter type rol_usuario add value if not exists 'cliente_aduanero';

-- 2) Dueño del subárbol: la empresa "cliente final" apunta a la empresa del
--    cliente aduanero (auto-referencia). null = cliente directo de Alyem.
alter table empresas add column if not exists cliente_aduanero_id uuid references empresas(id) on delete set null;
create index if not exists idx_empresas_cliente_aduanero on empresas (cliente_aduanero_id);
