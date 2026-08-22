-- ============================================================================
-- Alyem Customs — Seed base (sin datos transaccionales ni clientes).
-- Carga: staff de Alyem, configuración, los 13 estados, tipos de documento y un
-- listado inicial de aduanas. Ejecutar DESPUÉS de 01-schema.sql.
-- El resto (empresas, usuarios cliente, operaciones) se crea desde la app.
-- ============================================================================

set search_path to aylem;

-- Limpieza previa (idempotente): permite reejecutar el seed sin conflictos.
-- Requiere que 01-schema.sql ya haya creado las tablas del nuevo modelo.
delete from usuarios;
delete from configuracion;
delete from estados_catalogo;
delete from tipos_documento;
delete from aduanas;

-- Usuarios de Alyem (login por usuario + contraseña; demo) --------------------
insert into usuarios (id, empresa_id, nombre, usuario, email, password, rol) values
  ('20000000-0000-0000-0000-000000000001', null, 'Ana Robles (Admin)',       'admin',  'admin@alyemcustoms.hn',  'admin123',  'admin'),
  ('20000000-0000-0000-0000-000000000002', null, 'Carlos Méndez (Operador)', 'carlos', 'carlos@alyemcustoms.hn', 'carlos123', 'operador'),
  ('20000000-0000-0000-0000-000000000003', null, 'Diana Fuentes (Operador)', 'diana',  'diana@alyemcustoms.hn',  'diana123',  'operador');

-- Configuración --------------------------------------------------------------
insert into configuracion (clave, valor, descripcion) values
  ('agencia_nombre',        'Alyem Customs',        'Nombre mostrado en la app y reportes'),
  ('zona_horaria',          'America/Tegucigalpa',  'Zona horaria de la agencia'),
  ('dias_gestion_fria',     '4',                    'Días sin actualización para marcar una operación como "fría"'),
  ('sla_dias_proceso',      '15',                   'SLA objetivo del proceso completo, en días');

-- Catálogo de estados: los 13 pasos + Cancelada ------------------------------
insert into estados_catalogo (nombre, orden, color, notifica_cliente, tipo) values
  ('Notificación del embarque',        1,  '#f59e0b', true, 'normal'),
  ('Revisión de documentación',        2,  '#3b82f6', true, 'normal'),
  ('Documentos faltantes / ENP',       3,  '#f97316', true, 'normal'),
  ('Envío a aforo y digital',          4,  '#8b5cf6', true, 'normal'),
  ('Gestión con la naviera',           5,  '#6366f1', true, 'normal'),
  ('Liquidación de la declaración',    6,  '#0ea5e9', true, 'normal'),
  ('Envío del boletín',                7,  '#14b8a6', true, 'normal'),
  ('Pago del boletín',                 8,  '#10b981', true, 'normal'),
  ('Selectivo',                        9,  '#eab308', true, 'normal'),
  ('Levante de aduana',                10, '#22c55e', true, 'normal'),
  ('Entrega del gatepass',             11, '#84cc16', true, 'normal'),
  ('Facturación del servicio',         12, '#06b6d4', true, 'normal'),
  ('Cierre del ciclo',                 13, '#64748b', true, 'final'),
  ('Cancelada',                        90, '#991b1b', true, 'cancelada');

-- Catálogo de tipos de documento ---------------------------------------------
insert into tipos_documento (nombre, orden) values
  ('Documento de transporte',                 1),
  ('Factura comercial',                       2),
  ('Traducción / descripción de la carga',    3),
  ('Póliza de seguro',                        4),
  ('Comprobante de pago al proveedor',        5),
  ('Permiso ARSA',                            6),
  ('Certificado de origen (TLC)',             7),
  ('Permiso fitosanitario',                   8),
  ('Permiso SEN',                             9),
  ('Permiso UTOH',                            10),
  ('Orden de inspección',                     11),
  ('Ficha técnica',                           12),
  ('Declaración de movimiento comercial (Panamá)', 13),
  ('Certificado de reexportación (Panamá)',   14),
  ('BL original',                             15),
  ('Listado de sellos',                       16),
  ('Manifiesto',                              17),
  ('Comprobante de pago del boletín',         18),
  ('Factura del servicio',                    19),
  ('Otro',                                    20);

-- Maestro de aduanas (listado inicial; Alyem puede importar el completo por Excel)
insert into aduanas (nombre, codigo) values
  ('Puerto Cortés',                         'HNPCR'),
  ('Aduana La Mesa (San Pedro Sula)',       'HNLME'),
  ('Aeropuerto Toncontín (Tegucigalpa)',    'HNTGU'),
  ('El Amatillo',                           'HNAMA'),
  ('Agua Caliente',                         'HNAGC'),
  ('El Poy',                                'HNEPO'),
  ('Las Manos',                             'HNLMA'),
  ('Guasaule',                              'HNGUA'),
  ('Henecán (San Lorenzo)',                 'HNHEN'),
  ('La Ceiba',                              'HNLCE'),
  ('Roatán',                                'HNROA'),
  ('El Florido',                            'HNFLO');
