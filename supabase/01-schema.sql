-- ============================================================================
-- Alyem Customs — Plataforma de seguimiento aduanero (proceso de 13 pasos)
-- Sin RLS, sin AUTH. Aislamiento por empresa y permisos en el código servidor.
-- Datos en el esquema 'aylem' (proyecto Supabase compartido: NO tocar public).
-- Reejecutar este archivo REINICIA el esquema (limpia todos los datos).
-- ============================================================================

create schema if not exists aylem;
set search_path to aylem;

-- Reinicio idempotente (orden inverso de dependencias) -----------------------
drop view  if exists v_tiempos_etapa            cascade;
drop view  if exists v_gestion_estado_actual    cascade;

drop table if exists calificaciones             cascade;
drop table if exists mensajes                   cascade;
drop table if exists notificaciones             cascade;
drop table if exists documentos_requeridos      cascade;
drop table if exists documentos                 cascade;
drop table if exists eventos                    cascade;
drop table if exists gestiones                  cascade;
drop table if exists aduanas                    cascade;
drop table if exists configuracion              cascade;
drop table if exists tipos_documento            cascade;
drop table if exists estados_catalogo           cascade;
drop table if exists usuarios                   cascade;
drop table if exists empresas                   cascade;

-- Tablas del modelo financiero/cotizaciones anterior (por si existían) --------
drop table if exists pago_aplicaciones          cascade;
drop table if exists pagos                        cascade;
drop table if exists liquidacion_lineas         cascade;
drop table if exists liquidaciones              cascade;
drop table if exists cuentas_bancarias          cascade;
drop table if exists conceptos_cobro            cascade;
drop table if exists cotizacion_lineas          cascade;
drop table if exists cotizaciones               cascade;

drop type  if exists estado_factura             cascade;
drop type  if exists forma_pago                 cascade;
drop type  if exists estado_cotizacion          cascade;
drop type  if exists estado_pago                cascade;
drop type  if exists destinatario_cobro         cascade;
drop type  if exists estado_liquidacion         cascade;
drop type  if exists contexto_adjunto           cascade;
drop type  if exists estado_documento           cascade;
drop type  if exists canal_selectividad         cascade;
drop type  if exists tipo_evento                cascade;
drop type  if exists tipo_estado                cascade;
drop type  if exists modo_transporte            cascade;
drop type  if exists tipo_operacion             cascade;
drop type  if exists rol_usuario                cascade;

-- Enums ----------------------------------------------------------------------
create type rol_usuario        as enum ('cliente', 'operador', 'admin');
create type tipo_operacion     as enum ('importacion', 'exportacion', 'transito');
create type tipo_estado        as enum ('normal', 'pausa', 'cancelada', 'final');
create type tipo_evento        as enum ('estado', 'observacion');
create type canal_selectividad as enum ('verde', 'amarillo', 'rojo');
create type estado_documento   as enum ('pendiente', 'aceptado', 'rechazado');
create type contexto_adjunto   as enum ('gestion', 'evento', 'mensaje');
create type forma_pago         as enum ('transferencia_pagada', 'transferencia_pendiente', 'tarjeta_credito', 'otros');
create type estado_factura     as enum ('en_proceso', 'enviada');

-- Identidad ------------------------------------------------------------------
create table empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  id_fiscal   text,
  contacto    text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table usuarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references empresas(id) on delete set null,
  nombre      text not null,
  usuario     text unique,                 -- login por nombre de usuario
  email       text unique,                 -- contacto (opcional)
  password    text,                        -- texto plano (demo, NO producción)
  rol         rol_usuario not null,
  permisos    jsonb,                        -- null => defaults del rol
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Catálogos ------------------------------------------------------------------
-- Etapas del proceso (los 13 pasos + transversales).
create table estados_catalogo (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  orden            int  not null default 0,
  color            text not null default '#64748b',
  notifica_cliente boolean not null default true,
  tipo             tipo_estado not null default 'normal',
  activo           boolean not null default true
);

create table tipos_documento (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null,
  orden   int  not null default 0,
  activo  boolean not null default true
);

-- Maestro de aduanas de ingreso (lo carga Alyem; import Excel/CSV).
create table aduanas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  codigo     text not null unique,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

create table configuracion (
  clave       text primary key,
  valor       text,
  descripcion text
);

-- Operación (gestión) y trazabilidad -----------------------------------------
create table gestiones (
  id                   uuid primary key default gen_random_uuid(),
  referencia           text not null unique,               -- GES-YYYY-NNNN
  empresa_id           uuid not null references empresas(id) on delete cascade,
  operador_id          uuid references usuarios(id) on delete set null,
  tipo_operacion       tipo_operacion not null default 'importacion',
  consignatario        text,
  contenedores         text,
  public_token         text not null unique default replace(gen_random_uuid()::text, '-', ''),
  fecha_solicitud      timestamptz not null default now(),

  -- Paso 1 — Notificación del embarque (cliente)
  naviera              text,
  eta                  date,
  aduana_id            uuid references aduanas(id) on delete set null,
  proveedor            text,
  numero_factura       text,
  proviene_panama      boolean not null default false,

  -- Paso 2 — Revisión y registro de datos (Alyem)
  valor_fob            numeric,
  valor_flete          numeric,
  valor_seguro         numeric,
  otros_gastos         numeric,
  termino_compra       text,                                -- Incoterm
  descripcion_carga    text,
  origen_carga         text,
  marca                text,
  modelo               text,
  forma_pago           forma_pago,
  forma_pago_otro      text,
  -- DUCA T
  razon_social         text,
  rtn                  text,
  kilos                numeric,
  bultos               numeric,
  numeros_factura      text,
  carta_porte          text,

  -- Paso 3 — Documentos faltantes / ENP
  numero_np            text,

  -- Paso 4 — Envío a aforo y digital
  aforo                boolean,
  digital              boolean,
  previa               boolean,

  -- Paso 5 — Gestión con la naviera
  naviera_aplica         boolean,
  manifiesto_presentado  boolean,
  liberacion             boolean,
  doc_transporte_original boolean,
  tiempo_libre_dias      int,
  fecha_fin_dias_libres  date,
  naviera_observaciones  text,

  -- Paso 6 — Liquidación de la declaración
  correlativo_liquidacion text,

  -- Paso 7 / 8 — Boletín
  boletin_enviado      boolean,
  boletin_pagado       boolean,

  -- Paso 9 — Selectivo
  canal_selectivo      canal_selectividad,

  -- Paso 10 — Levante
  fecha_hora_despacho  timestamptz,

  -- Paso 11 — Gatepass (solo Puerto Cortés)
  gatepass_aplica      boolean,
  transporte_naviera   boolean,
  gatepass_entregado   boolean,
  gatepass_observacion text,

  -- Paso 12 — Facturación del servicio
  estado_factura       estado_factura,

  -- Paso 13 — Cierre del ciclo (cliente)
  recibido             boolean not null default false,

  created_at           timestamptz not null default now()
);
create index on gestiones (empresa_id);
create index on gestiones (operador_id);
create index on gestiones (aduana_id);

create table eventos (
  id                 uuid primary key default gen_random_uuid(),
  gestion_id         uuid not null references gestiones(id) on delete cascade,
  tipo               tipo_evento not null default 'estado',
  estado_id          uuid references estados_catalogo(id) on delete set null,
  fecha_evento       timestamptz not null default now(),   -- editable
  observacion        text,
  canal_selectividad canal_selectividad,
  interno            boolean not null default false,
  usuario_id         uuid references usuarios(id) on delete set null,
  created_at         timestamptz not null default now()    -- auditoría, no editable
);
create index on eventos (gestion_id, fecha_evento desc);

-- Adjuntos (tabla única, contextual) -----------------------------------------
create table documentos (
  id                uuid primary key default gen_random_uuid(),
  gestion_id        uuid not null references gestiones(id) on delete cascade,
  tipo_documento_id uuid references tipos_documento(id) on delete set null,
  contexto          contexto_adjunto not null default 'gestion',
  ref_id            uuid,
  nombre_archivo    text not null,
  storage_path      text not null,
  estado            estado_documento not null default 'pendiente',
  motivo_rechazo    text,
  version           int not null default 1,
  reemplaza_a       uuid references documentos(id) on delete set null,
  subido_por        uuid references usuarios(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index on documentos (gestion_id);

create table documentos_requeridos (
  id                uuid primary key default gen_random_uuid(),
  gestion_id        uuid not null references gestiones(id) on delete cascade,
  tipo_documento_id uuid not null references tipos_documento(id) on delete cascade,
  nota              text,
  cumplido          boolean not null default false,
  created_at        timestamptz not null default now()
);
create index on documentos_requeridos (gestion_id);

-- Colaboración y satisfacción ------------------------------------------------
create table notificaciones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  tipo        text not null,
  gestion_id  uuid references gestiones(id) on delete cascade,
  mensaje     text not null,
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on notificaciones (usuario_id, leida);

create table mensajes (
  id          uuid primary key default gen_random_uuid(),
  gestion_id  uuid not null references gestiones(id) on delete cascade,
  usuario_id  uuid references usuarios(id) on delete set null,
  texto       text not null,
  adjunto_id  uuid references documentos(id) on delete set null,
  leido_por   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index on mensajes (gestion_id, created_at);

create table calificaciones (
  id               uuid primary key default gen_random_uuid(),
  gestion_id       uuid not null unique references gestiones(id) on delete cascade,
  empresa_id       uuid references empresas(id) on delete set null,
  usuario_id       uuid references usuarios(id) on delete set null,
  estrellas        int not null check (estrellas between 1 and 5),
  dim_comunicacion int check (dim_comunicacion between 1 and 5),
  dim_tiempos      int check (dim_tiempos between 1 and 5),
  dim_cobros       int check (dim_cobros between 1 and 5),   -- UI: "Claridad del proceso"
  comentario       text,
  created_at       timestamptz not null default now()
);

-- Vistas de apoyo ------------------------------------------------------------
-- Estado actual = último evento tipo 'estado' de cada gestión.
create view v_gestion_estado_actual as
select distinct on (e.gestion_id)
  e.gestion_id,
  e.estado_id,
  ec.nombre  as estado_nombre,
  ec.color   as estado_color,
  ec.tipo    as estado_tipo,
  e.fecha_evento
from eventos e
join estados_catalogo ec on ec.id = e.estado_id
where e.tipo = 'estado'
order by e.gestion_id, e.fecha_evento desc, e.created_at desc;

-- Tiempos entre eventos de estado consecutivos (para métricas/SLA).
create view v_tiempos_etapa as
select
  e.gestion_id,
  ec.nombre as estado_nombre,
  e.fecha_evento,
  lead(e.fecha_evento) over (partition by e.gestion_id order by e.fecha_evento)
    - e.fecha_evento as duracion
from eventos e
join estados_catalogo ec on ec.id = e.estado_id
where e.tipo = 'estado';

-- Permisos para los roles de Supabase (sin RLS; el acceso es server-side). ----
grant usage on schema aylem to anon, authenticated, service_role;
grant all privileges on all tables    in schema aylem to anon, authenticated, service_role;
grant all privileges on all sequences in schema aylem to anon, authenticated, service_role;
grant all privileges on all functions in schema aylem to anon, authenticated, service_role;
alter default privileges in schema aylem grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema aylem grant all on sequences to anon, authenticated, service_role;

-- IMPORTANTE: exponer 'aylem' a la API se hace desde el panel de Supabase
-- (Project Settings → API → Exposed schemas → agregar 'aylem').
