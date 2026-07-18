-- ============================================================================
-- Datos de ejemplo (modo demo). Ejecutar DESPUÉS de schema.sql.
-- UUIDs fijos para que el seed sea determinista y referenciable.
-- ============================================================================

set search_path to aylem;

-- Empresas -------------------------------------------------------------------
insert into empresas (id, nombre, id_fiscal, contacto) values
  ('10000000-0000-0000-0000-000000000001', 'Importadora del Valle S.A.', '08019995123456', 'compras@importadoravalle.hn'),
  ('10000000-0000-0000-0000-000000000002', 'Comercial Pacífico S. de R.L.', '05019990654321', 'logistica@comercialpacifico.hn');

-- Usuarios con contraseña (login básico del demo) ----------------------------
insert into usuarios (id, empresa_id, nombre, email, password, rol) values
  ('20000000-0000-0000-0000-000000000001', null, 'Ana Robles (Admin)',        'admin@agenciaduanera.hn',  'admin123',  'admin'),
  ('20000000-0000-0000-0000-000000000002', null, 'Carlos Méndez (Operador)',  'carlos@agenciaduanera.hn', 'carlos123', 'operador'),
  ('20000000-0000-0000-0000-000000000003', null, 'Diana Fuentes (Operador)',  'diana@agenciaduanera.hn',  'diana123',  'operador'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Luis Portillo',   'luis@importadoravalle.hn', 'luis123',  'cliente'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'María Cálix',     'maria@importadoravalle.hn','maria123', 'cliente'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Jorge Almendárez','jorge@comercialpacifico.hn','jorge123','cliente');

-- Catálogo de estados --------------------------------------------------------
insert into estados_catalogo (id, nombre, orden, color, notifica_cliente, tipo) values
  ('30000000-0000-0000-0000-000000000001', 'Solicitada',          1,  '#f59e0b', true,  'normal'),
  ('30000000-0000-0000-0000-000000000002', 'Aceptada / En proceso',2, '#3b82f6', true,  'normal'),
  ('30000000-0000-0000-0000-000000000003', 'En tránsito',         3,  '#6366f1', true,  'normal'),
  ('30000000-0000-0000-0000-000000000004', 'En puerto',           4,  '#0ea5e9', true,  'normal'),
  ('30000000-0000-0000-0000-000000000005', 'En documentación',    5,  '#8b5cf6', true,  'normal'),
  ('30000000-0000-0000-0000-000000000006', 'Selectividad',        6,  '#eab308', true,  'normal'),
  ('30000000-0000-0000-0000-000000000007', 'Liberación',          7,  '#10b981', true,  'normal'),
  ('30000000-0000-0000-0000-000000000008', 'En transporte',       8,  '#14b8a6', true,  'normal'),
  ('30000000-0000-0000-0000-000000000009', 'En bodega / Entregada',9, '#22c55e', true,  'normal'),
  ('30000000-0000-0000-0000-00000000000a', 'Cerrada',             10, '#64748b', true,  'final'),
  ('30000000-0000-0000-0000-00000000000b', 'En pausa',            90, '#ef4444', true,  'pausa'),
  ('30000000-0000-0000-0000-00000000000c', 'Cancelada',           91, '#991b1b', true,  'cancelada');

-- Catálogo de tipos de documento ---------------------------------------------
insert into tipos_documento (id, nombre, orden) values
  ('40000000-0000-0000-0000-000000000001', 'BL / Guía aérea / Carta de porte', 1),
  ('40000000-0000-0000-0000-000000000002', 'Factura comercial',                2),
  ('40000000-0000-0000-0000-000000000003', 'Lista de empaque',                 3),
  ('40000000-0000-0000-0000-000000000004', 'Certificado de origen',            4),
  ('40000000-0000-0000-0000-000000000005', 'DUCA / Declaración',               5),
  ('40000000-0000-0000-0000-000000000006', 'Póliza',                           6),
  ('40000000-0000-0000-0000-000000000007', 'Permiso',                          7),
  ('40000000-0000-0000-0000-000000000008', 'Comprobante de pago',              8),
  ('40000000-0000-0000-0000-000000000009', 'Otro',                             9);

-- Catálogo de conceptos de cobro ---------------------------------------------
insert into conceptos_cobro (id, nombre, categoria) values
  ('50000000-0000-0000-0000-000000000001', 'DAI (Derecho Arancelario)', 'impuesto'),
  ('50000000-0000-0000-0000-000000000002', 'ISV / IVA',                 'impuesto'),
  ('50000000-0000-0000-0000-000000000003', 'Impuesto selectivo',        'impuesto'),
  ('50000000-0000-0000-0000-000000000004', 'Flete marítimo',            'flete'),
  ('50000000-0000-0000-0000-000000000005', 'Flete terrestre',           'flete'),
  ('50000000-0000-0000-0000-000000000006', 'Almacenaje',                'gasto'),
  ('50000000-0000-0000-0000-000000000007', 'Demoras (demurrage)',       'gasto'),
  ('50000000-0000-0000-0000-000000000008', 'Honorarios de agencia',     'honorario'),
  ('50000000-0000-0000-0000-000000000009', 'Gastos portuarios',         'gasto'),
  ('50000000-0000-0000-0000-00000000000a', 'Transporte local',          'flete'),
  ('50000000-0000-0000-0000-00000000000b', 'Otros',                     'otro');

-- Cuentas bancarias (instrucciones de pago) ----------------------------------
insert into cuentas_bancarias (id, banco, numero, titular, moneda, instrucciones) values
  ('60000000-0000-0000-0000-000000000001', 'Banco Atlántida', '0110-023-456789', 'Agencia de Aduana Aylem Customs', 'HNL', 'Cuenta de ahorro. Enviar comprobante al reportar el pago.'),
  ('60000000-0000-0000-0000-000000000002', 'Banco Ficohsa',   '2001-556677-USD', 'Agencia de Aduana Aylem Customs', 'USD', 'Cuenta en dólares para flete e impuestos en USD.');

-- Configuración --------------------------------------------------------------
insert into configuracion (clave, valor, descripcion) values
  ('agencia_nombre',        'Agencia de Aduana Aylem Customs','Nombre mostrado en la app y reportes PDF'),
  ('zona_horaria',          'America/Tegucigalpa',            'Zona horaria de la agencia'),
  ('dias_gestion_fria',     '4',                              'Días sin actualización para marcar una gestión como "fría"'),
  ('estados_requieren_pago','30000000-0000-0000-0000-000000000008,30000000-0000-0000-0000-000000000009', 'Estados que alertan si hay saldo pendiente'),
  ('sla_dias_puerto_entrega','7',                             'SLA objetivo en días de puerto a entrega');

-- ============================================================================
-- Gestiones
-- ============================================================================

-- GES-2026-0001 — Valle, importación marítima, avanzada (Selectividad amarillo)
insert into gestiones (id, referencia, empresa_id, operador_id, referencia_cliente, consignatario,
  tipo_operacion, modo, bl, naviera, buque_viaje, contenedores, tipo_contenedor,
  puerto_origen, puerto_destino, descripcion_mercancia, proveedor, eta, fecha_solicitud,
  fecha_arribo, dias_libres, fecha_inicio_libres, public_token) values
  ('70000000-0000-0000-0000-000000000001', 'GES-2026-0001',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   'PO-4471', 'Importadora del Valle S.A.', 'importacion', 'maritimo',
   'MAEU-778291', 'Maersk', 'Maersk Sentosa / 214W', 'MRKU2213445', '40HC',
   'Shanghái, China', 'Puerto Cortés, Honduras', 'Electrodomésticos de línea blanca', 'Ningbo Home Appliances Co.',
   '2026-07-10', '2026-06-20 09:00-06', '2026-07-11', 5, '2026-07-11',
   'valle0001tokenpublicoseguimiento01');

-- GES-2026-0002 — Valle, importación aérea, temprana (liquidación estimada)
insert into gestiones (id, referencia, empresa_id, operador_id, referencia_cliente, consignatario,
  tipo_operacion, modo, bl, naviera, buque_viaje, puerto_origen, puerto_destino,
  descripcion_mercancia, proveedor, eta, fecha_solicitud, public_token) values
  ('70000000-0000-0000-0000-000000000002', 'GES-2026-0002',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
   'PO-4488', 'Importadora del Valle S.A.', 'importacion', 'aereo',
   '045-77219902', 'American Airlines Cargo', 'AA-982', 'Miami, EE.UU.', 'Aeropuerto Ramón Villeda Morales',
   'Repuestos electrónicos', 'TechParts LLC', '2026-07-22', '2026-07-14 11:30-06',
   'valle0002tokenpublicoseguimiento02');

-- GES-2026-0003 — Pacífico, importación marítima, CERRADA (con calificación baja)
insert into gestiones (id, referencia, empresa_id, operador_id, referencia_cliente, consignatario,
  tipo_operacion, modo, bl, naviera, buque_viaje, contenedores, tipo_contenedor,
  puerto_origen, puerto_destino, descripcion_mercancia, proveedor, eta, fecha_solicitud,
  fecha_arribo, fecha_liberacion, fecha_entrega, unidades_importadas, public_token) values
  ('70000000-0000-0000-0000-000000000003', 'GES-2026-0003',
   '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   'OC-2025-990', 'Comercial Pacífico S. de R.L.', 'importacion', 'maritimo',
   'CMAU-119088', 'CMA CGM', 'CMA CGM Danube / 088E', 'CMAU7788991', '20GP',
   'Busán, Corea del Sur', 'Puerto Cortés, Honduras', 'Calzado deportivo', 'Busan Footwear Ltd.',
   '2026-06-05', '2026-05-15 08:00-06', '2026-06-06', '2026-06-12', '2026-06-15', 4800,
   'pacifico0003tokenpublicoseguimiento3');

-- GES-2026-0004 — Pacífico, exportación terrestre, en tránsito
insert into gestiones (id, referencia, empresa_id, operador_id, referencia_cliente, consignatario,
  tipo_operacion, modo, bl, puerto_origen, puerto_destino, descripcion_mercancia, proveedor,
  eta, fecha_solicitud, public_token) values
  ('70000000-0000-0000-0000-000000000004', 'GES-2026-0004',
   '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003',
   'EXP-330', 'exportacion', 'terrestre',
   'CP-TERR-5521', 'San Pedro Sula, Honduras', 'Ciudad de Guatemala, Guatemala',
   'Café tostado en grano', 'Comercial Pacífico', '2026-07-19', '2026-07-15 14:00-06',
   'pacifico0004tokenpublicoseguimiento4');

-- ============================================================================
-- Eventos (timeline)
-- ============================================================================

-- GES-0001
insert into eventos (gestion_id, tipo, estado_id, fecha_evento, observacion, canal_selectividad, interno, usuario_id) values
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000001','2026-06-20 09:00-06','Solicitud creada por el cliente.', null, false,'20000000-0000-0000-0000-000000000004'),
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000002','2026-06-21 10:15-06','Aceptada. Operador asignado: Carlos Méndez.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000003','2026-06-25 16:00-06','Zarpó de Shanghái. Trasbordo previsto en Panamá.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','observacion',null,'2026-07-02 09:00-06','ETA actualizada al 10/07 por congestión en trasbordo.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000004','2026-07-11 07:30-06','Arribo confirmado a Puerto Cortés.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000005','2026-07-13 11:00-06','Declaración presentada.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','estado','30000000-0000-0000-0000-000000000006','2026-07-15 09:00-06','Canal amarillo: revisión documental programada para mañana 9 a. m.','amarillo', false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000001','observacion',null,'2026-07-15 09:05-06','Nota interna: adjuntar factura corregida antes de la revisión.', null, true,'20000000-0000-0000-0000-000000000002');

-- GES-0002
insert into eventos (gestion_id, tipo, estado_id, fecha_evento, observacion, interno, usuario_id) values
  ('70000000-0000-0000-0000-000000000002','estado','30000000-0000-0000-0000-000000000001','2026-07-14 11:30-06','Solicitud creada por el cliente.', false,'20000000-0000-0000-0000-000000000005'),
  ('70000000-0000-0000-0000-000000000002','estado','30000000-0000-0000-0000-000000000002','2026-07-15 08:45-06','Aceptada. Pre-liquidación estimada enviada.', false,'20000000-0000-0000-0000-000000000003');

-- GES-0003 (ciclo completo hasta Cerrada)
insert into eventos (gestion_id, tipo, estado_id, fecha_evento, observacion, canal_selectividad, interno, usuario_id) values
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000001','2026-05-15 08:00-06','Solicitud creada.', null, false,'20000000-0000-0000-0000-000000000006'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000002','2026-05-16 09:00-06','Aceptada.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000003','2026-05-20 12:00-06','En tránsito desde Busán.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000004','2026-06-06 08:00-06','Arribo a Puerto Cortés.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000005','2026-06-08 10:00-06','Declaración presentada.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000006','2026-06-10 09:00-06','Canal verde: levante inmediato.','verde', false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000007','2026-06-12 14:00-06','Levante autorizado.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000008','2026-06-14 08:00-06','En transporte a bodega. Transportista: TransHN, placa PBC-2231.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-000000000009','2026-06-15 16:00-06','Entregada en bodega del cliente. Acta firmada.', null, false,'20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003','estado','30000000-0000-0000-0000-00000000000a','2026-06-18 09:00-06','Documentos completos y pagos verificados. Gestión cerrada.', null, false,'20000000-0000-0000-0000-000000000002');

-- GES-0004
insert into eventos (gestion_id, tipo, estado_id, fecha_evento, observacion, interno, usuario_id) values
  ('70000000-0000-0000-0000-000000000004','estado','30000000-0000-0000-0000-000000000001','2026-07-15 14:00-06','Solicitud de exportación creada.', false,'20000000-0000-0000-0000-000000000006'),
  ('70000000-0000-0000-0000-000000000004','estado','30000000-0000-0000-0000-000000000002','2026-07-16 08:30-06','Aceptada. Documentación de exportación en preparación.', false,'20000000-0000-0000-0000-000000000003'),
  ('70000000-0000-0000-0000-000000000004','estado','30000000-0000-0000-0000-000000000003','2026-07-16 15:00-06','En tránsito terrestre hacia frontera Agua Caliente.', false,'20000000-0000-0000-0000-000000000003');

-- ============================================================================
-- Documentos requeridos y documentos
-- ============================================================================
insert into documentos_requeridos (gestion_id, tipo_documento_id, nota, cumplido) values
  ('70000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','BL original endosado.', true),
  ('70000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','La factura debe venir con Incoterm y desglose.', true),
  ('70000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','Certificado de origen para preferencia arancelaria.', false),
  ('70000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','Factura comercial de repuestos.', false);

insert into documentos (id, gestion_id, tipo_documento_id, contexto, nombre_archivo, storage_path, estado, subido_por, created_at) values
  ('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','gestion','BL-MAEU-778291.pdf','seed/BL-MAEU-778291.pdf','aceptado','20000000-0000-0000-0000-000000000004','2026-06-20 09:10-06'),
  ('80000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','gestion','factura-ningbo.pdf','seed/factura-ningbo.pdf','aceptado','20000000-0000-0000-0000-000000000004','2026-06-20 09:12-06'),
  ('80000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000005','gestion','DUCA-2026-0003.pdf','seed/DUCA-2026-0003.pdf','aceptado','20000000-0000-0000-0000-000000000002','2026-06-08 10:05-06');

-- ============================================================================
-- Financiero
-- ============================================================================

-- Liquidación emitida de GES-0001 (con pago parcial verificado)
insert into liquidaciones (id, gestion_id, estado, created_at) values
  ('90000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','emitida','2026-07-13 12:00-06');
insert into liquidacion_lineas (id, liquidacion_id, concepto_id, descripcion, monto, moneda, destinatario) values
  ('91000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','DAI 15% sobre CIF', 45000, 'HNL','institucion'),
  ('91000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','ISV 15%', 67500, 'HNL','institucion'),
  ('91000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000008','Honorarios de agencia', 12000, 'HNL','agencia'),
  ('91000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000009','Gastos portuarios', 8500, 'HNL','agencia');

-- Pago verificado que cubre honorarios + gastos portuarios (agencia)
insert into pagos (id, gestion_id, liquidacion_id, monto, moneda, fecha_pago, banco_medio, referencia, comprobante_path, estado, reportado_por, verificado_por, created_at) values
  ('92000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001', 20500,'HNL','2026-07-14','Banco Atlántida','TRF-889120','seed/comprobante-0001.pdf','verificado','20000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','2026-07-14 15:00-06');
insert into pago_aplicaciones (pago_id, linea_id, monto_aplicado) values
  ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000003', 12000),
  ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000004', 8500);

-- Pago reportado (pendiente) de impuestos
insert into pagos (id, gestion_id, liquidacion_id, monto, moneda, fecha_pago, banco_medio, referencia, comprobante_path, estado, reportado_por, created_at) values
  ('92000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001', 112500,'HNL','2026-07-16','Banco Atlántida','TRF-889305','seed/comprobante-0001b.pdf','reportado','20000000-0000-0000-0000-000000000004','2026-07-16 10:00-06');
insert into pago_aplicaciones (pago_id, linea_id, monto_aplicado) values
  ('92000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001', 45000),
  ('92000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000002', 67500);

-- Liquidación ESTIMADA de GES-0002 (pre-liquidación, cliente aparta flujo)
insert into liquidaciones (id, gestion_id, estado, created_at) values
  ('90000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002','estimada','2026-07-15 09:00-06');
insert into liquidacion_lineas (liquidacion_id, concepto_id, descripcion, monto, moneda, destinatario) values
  ('90000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000004','Flete aéreo estimado', 1800, 'USD','institucion'),
  ('90000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000008','Honorarios estimados', 9000, 'HNL','agencia');

-- Liquidación PAGADA de GES-0003 (para landed cost y reportes)
insert into liquidaciones (id, gestion_id, estado, created_at) values
  ('90000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003','pagada','2026-06-08 12:00-06');
insert into liquidacion_lineas (id, liquidacion_id, concepto_id, descripcion, monto, moneda, destinatario) values
  ('91000000-0000-0000-0000-00000000000a','90000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000001','DAI', 28000, 'HNL','institucion'),
  ('91000000-0000-0000-0000-00000000000b','90000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000002','ISV', 42000, 'HNL','institucion'),
  ('91000000-0000-0000-0000-00000000000c','90000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000004','Flete marítimo', 65000, 'HNL','institucion'),
  ('91000000-0000-0000-0000-00000000000d','90000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000008','Honorarios de agencia', 15000, 'HNL','agencia');
insert into pagos (id, gestion_id, liquidacion_id, monto, moneda, fecha_pago, banco_medio, referencia, comprobante_path, estado, reportado_por, verificado_por, created_at) values
  ('92000000-0000-0000-0000-00000000000a','70000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003', 150000,'HNL','2026-06-11','Banco Ficohsa','TRF-551200','seed/comprobante-0003.pdf','verificado','20000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','2026-06-11 09:00-06');
insert into pago_aplicaciones (pago_id, linea_id, monto_aplicado) values
  ('92000000-0000-0000-0000-00000000000a','91000000-0000-0000-0000-00000000000a', 28000),
  ('92000000-0000-0000-0000-00000000000a','91000000-0000-0000-0000-00000000000b', 42000),
  ('92000000-0000-0000-0000-00000000000a','91000000-0000-0000-0000-00000000000c', 65000),
  ('92000000-0000-0000-0000-00000000000a','91000000-0000-0000-0000-00000000000d', 15000);

-- ============================================================================
-- Mensajería, cotizaciones, calificaciones, notificaciones
-- ============================================================================
insert into mensajes (gestion_id, usuario_id, texto, created_at) values
  ('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Buenos días, ¿la revisión documental requiere que estemos presentes?','2026-07-15 09:30-06'),
  ('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Buenos días Luis, no es necesario. Nosotros atendemos la revisión y les informamos el resultado.','2026-07-15 09:45-06');

insert into cotizaciones (id, empresa_id, prospecto_nombre, prospecto_email, descripcion, estado, created_at) values
  ('a0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002', null, null, 'Importación marítima de 2x40HC de muebles desde Vietnam. Requiere estimado de impuestos y honorarios.', 'solicitada','2026-07-16 10:00-06'),
  ('a0000000-0000-0000-0000-000000000002', null, 'Distribuidora Norteña', 'ventas@distnortena.hn', 'Importación aérea de dispositivos médicos desde Miami. Solicita cotización de servicio completo.', 'respondida','2026-07-10 11:00-06');
insert into cotizacion_lineas (cotizacion_id, concepto, monto, moneda) values
  ('a0000000-0000-0000-0000-000000000002','Honorarios de agencia', 12000, 'HNL'),
  ('a0000000-0000-0000-0000-000000000002','Gastos estimados', 4500, 'HNL');

-- Calificación BAJA en GES-0003 → dispara alerta al admin
insert into calificaciones (gestion_id, empresa_id, usuario_id, estrellas, dim_comunicacion, dim_tiempos, dim_cobros, comentario) values
  ('70000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000006', 2, 2, 3, 2,
   'La entrega llegó bien pero nos costó saber el estado en puerto; tuvimos que llamar varias veces.');

-- Notificaciones de ejemplo (bandeja de la campana) --------------------------
insert into notificaciones (usuario_id, tipo, gestion_id, mensaje, leida) values
  ('20000000-0000-0000-0000-000000000004','liquidacion_emitida','70000000-0000-0000-0000-000000000001','Se emitió la liquidación de la gestión GES-2026-0001.', false),
  ('20000000-0000-0000-0000-000000000002','pago_reportado','70000000-0000-0000-0000-000000000001','Luis Portillo reportó un pago de L 112,500.00 en GES-2026-0001.', false),
  ('20000000-0000-0000-0000-000000000001','calificacion_baja','70000000-0000-0000-0000-000000000003','Calificación de 2★ en GES-2026-0003. Requiere seguimiento.', false);
