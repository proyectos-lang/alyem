-- ============================================================================
-- Plataforma de seguimiento aduanero — Esquema (DEMO)
-- Sin RLS, sin AUTH. Aislamiento por empresa y permisos en el código servidor.
-- Los datos viven en el esquema 'aylem' (proyecto Supabase compartido: NO tocar public).
-- Ejecutar en el SQL Editor de Supabase (o `supabase db reset`).
-- ============================================================================

create schema if not exists aylem;
-- search_path acotado a 'aylem': todo drop/create afecta SOLO a este esquema.
set search_path to aylem;

-- Reinicio idempotente (orden inverso de dependencias) -----------------------
drop view  if exists v_tiempos_etapa            cascade;
drop view  if exists v_saldos_liquidacion       cascade;
drop view  if exists v_gestion_estado_actual    cascade;

drop table if exists calificaciones             cascade;
drop table if exists cotizacion_lineas          cascade;
drop table if exists cotizaciones               cascade;
drop table if exists mensajes                   cascade;
drop table if exists notificaciones             cascade;
drop table if exists pago_aplicaciones          cascade;
drop table if exists pagos                       cascade;
drop table if exists liquidacion_lineas         cascade;
drop table if exists liquidaciones              cascade;
drop table if exists documentos_requeridos      cascade;
drop table if exists documentos                 cascade;
drop table if exists eventos                    cascade;
drop table if exists gestiones                  cascade;
drop table if exists configuracion              cascade;
drop table if exists cuentas_bancarias          cascade;
drop table if exists conceptos_cobro            cascade;
drop table if exists tipos_documento            cascade;
drop table if exists estados_catalogo           cascade;
drop table if exists usuarios                   cascade;
drop table if exists empresas                   cascade;

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
create type modo_transporte    as enum ('maritimo', 'aereo', 'terrestre');
create type tipo_estado        as enum ('normal', 'pausa', 'cancelada', 'final');
create type tipo_evento        as enum ('estado', 'observacion');
create type canal_selectividad as enum ('verde', 'amarillo', 'rojo');
create type estado_documento   as enum ('pendiente', 'aceptado', 'rechazado');
create type contexto_adjunto   as enum ('gestion', 'evento', 'liquidacion', 'pago', 'mensaje');
create type estado_liquidacion as enum ('estimada', 'borrador', 'emitida', 'pagada', 'anulada');
create type destinatario_cobro as enum ('institucion', 'agencia');
create type estado_pago         as enum ('reportado', 'verificado', 'rechazado');
create type estado_cotizacion   as enum ('solicitada', 'respondida', 'aprobada', 'rechazada');

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
  -- Login por nombre de usuario (no correo).
  usuario     text unique,
  email       text unique,            -- contacto (opcional)
  -- Login básico del demo: contraseña en texto plano (NO usar en producción).
  password    text,
  rol         rol_usuario not null,
  -- null => usa los permisos por defecto del rol (ver lib/permisos.ts);
  -- si tiene valor, es la lista explícita de claves de permiso que aplica.
  permisos    jsonb,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Catálogos ------------------------------------------------------------------
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

create table conceptos_cobro (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  categoria text,
  activo    boolean not null default true
);

create table cuentas_bancarias (
  id            uuid primary key default gen_random_uuid(),
  banco         text not null,
  numero        text not null,
  titular       text not null,
  moneda        text not null default 'HNL',
  instrucciones text,
  activo        boolean not null default true
);

create table configuracion (
  clave       text primary key,
  valor       text,
  descripcion text
);

-- Gestión y timeline ---------------------------------------------------------
create table gestiones (
  id                   uuid primary key default gen_random_uuid(),
  referencia           text not null unique,               -- GES-YYYY-NNNN
  empresa_id           uuid not null references empresas(id) on delete cascade,
  operador_id          uuid references usuarios(id) on delete set null,
  referencia_cliente   text,                                -- PO / orden de compra
  consignatario        text,
  tipo_operacion       tipo_operacion not null default 'importacion',
  modo                 modo_transporte not null default 'maritimo',
  bl                   text,
  naviera              text,
  buque_viaje          text,
  contenedores         text,
  tipo_contenedor      text,
  puerto_origen        text,
  puerto_destino       text,
  descripcion_mercancia text,
  proveedor            text,
  eta                  date,
  fecha_solicitud      timestamptz not null default now(),
  fecha_arribo         date,
  fecha_liberacion     date,
  fecha_entrega        date,
  dias_libres          int,
  fecha_inicio_libres  date,
  unidades_importadas  numeric,
  public_token         text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at           timestamptz not null default now()
);
create index on gestiones (empresa_id);
create index on gestiones (operador_id);

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
  ref_id            uuid,                                   -- evento/liquidacion/pago/mensaje al que cuelga
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

-- Financiero -----------------------------------------------------------------
create table liquidaciones (
  id               uuid primary key default gen_random_uuid(),
  gestion_id       uuid not null references gestiones(id) on delete cascade,
  estado           estado_liquidacion not null default 'borrador',
  motivo_anulacion text,
  created_at       timestamptz not null default now()
);
create index on liquidaciones (gestion_id);

create table liquidacion_lineas (
  id               uuid primary key default gen_random_uuid(),
  liquidacion_id   uuid not null references liquidaciones(id) on delete cascade,
  concepto_id      uuid references conceptos_cobro(id) on delete set null,
  descripcion      text,
  monto            numeric not null default 0,
  moneda           text not null default 'HNL',
  destinatario     destinatario_cobro not null default 'agencia',
  anulada          boolean not null default false,
  motivo_anulacion text,
  created_at       timestamptz not null default now()
);
create index on liquidacion_lineas (liquidacion_id);

create table pagos (
  id               uuid primary key default gen_random_uuid(),
  gestion_id       uuid not null references gestiones(id) on delete cascade,
  liquidacion_id   uuid references liquidaciones(id) on delete set null,
  monto            numeric not null default 0,
  moneda           text not null default 'HNL',
  fecha_pago       date,
  banco_medio      text,
  referencia       text,
  comprobante_path text,
  estado           estado_pago not null default 'reportado',
  motivo_rechazo   text,
  reportado_por    uuid references usuarios(id) on delete set null,
  verificado_por   uuid references usuarios(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index on pagos (gestion_id);

create table pago_aplicaciones (
  id            uuid primary key default gen_random_uuid(),
  pago_id       uuid not null references pagos(id) on delete cascade,
  linea_id      uuid not null references liquidacion_lineas(id) on delete cascade,
  monto_aplicado numeric not null default 0
);
create index on pago_aplicaciones (pago_id);
create index on pago_aplicaciones (linea_id);

-- Colaboración, negocio y satisfacción ---------------------------------------
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

create table cotizaciones (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid references empresas(id) on delete set null,
  prospecto_nombre text,
  prospecto_email  text,
  descripcion     text,
  estado          estado_cotizacion not null default 'solicitada',
  gestion_id      uuid references gestiones(id) on delete set null,  -- al aprobarse
  created_at      timestamptz not null default now()
);

create table cotizacion_lineas (
  id             uuid primary key default gen_random_uuid(),
  cotizacion_id  uuid not null references cotizaciones(id) on delete cascade,
  concepto       text,
  monto          numeric not null default 0,
  moneda         text not null default 'HNL'
);
create index on cotizacion_lineas (cotizacion_id);

create table calificaciones (
  id               uuid primary key default gen_random_uuid(),
  gestion_id       uuid not null unique references gestiones(id) on delete cascade,
  empresa_id       uuid references empresas(id) on delete set null,
  usuario_id       uuid references usuarios(id) on delete set null,
  estrellas        int not null check (estrellas between 1 and 5),
  dim_comunicacion int check (dim_comunicacion between 1 and 5),
  dim_tiempos      int check (dim_tiempos between 1 and 5),
  dim_cobros       int check (dim_cobros between 1 and 5),
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

-- Saldos por liquidación (solo pagos verificados cuentan como pagado).
create view v_saldos_liquidacion as
select
  l.id as liquidacion_id,
  l.gestion_id,
  coalesce((select sum(ll.monto) from liquidacion_lineas ll
            where ll.liquidacion_id = l.id and not ll.anulada), 0) as total,
  coalesce((select sum(pa.monto_aplicado)
            from pago_aplicaciones pa
            join pagos p on p.id = pa.pago_id
            join liquidacion_lineas ll2 on ll2.id = pa.linea_id
            where ll2.liquidacion_id = l.id and p.estado = 'verificado'), 0) as pagado_verificado,
  coalesce((select sum(pa.monto_aplicado)
            from pago_aplicaciones pa
            join pagos p on p.id = pa.pago_id
            join liquidacion_lineas ll3 on ll3.id = pa.linea_id
            where ll3.liquidacion_id = l.id and p.estado = 'reportado'), 0) as reportado_pendiente
from liquidaciones l;

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
-- (Project Settings → API → Exposed schemas → agregar 'aylem' a la lista).
-- En este proyecto compartido, el panel es la fuente de verdad de los esquemas
-- expuestos; NO lo sobreescribimos por SQL para no afectar a las demás apps.
