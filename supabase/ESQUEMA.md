# Esquema de base de datos — `aylem`

> Documento vivo. Se actualiza conforme avanzan las fases de desarrollo.
> Fuente de verdad ejecutable: [`schema.sql`](./schema.sql) y [`seed.sql`](./seed.sql).

## Contexto

- Todos los datos del demo viven en el esquema Postgres **`aylem`** (el proyecto Supabase
  es compartido; `public` no se toca para evitar colisiones con otras apps).
- **Sin RLS y sin AUTH**: el aislamiento por empresa y los permisos se aplican en el código
  del servidor (Next.js server actions / RSC), no en la base.
- Acceso desde la app con el **service role key** y `db.schema = 'aylem'`.

## Puesta en marcha (manual, SQL Editor de Supabase)

1. Ejecuta [`schema.sql`](./schema.sql) → crea el esquema `aylem`, tipos, tablas, vistas y
   otorga permisos a los roles de Supabase.
2. Ejecuta [`seed.sql`](./seed.sql) → carga datos de ejemplo.
3. **Expón `aylem` a la API**: Supabase → **Project Settings → API → Exposed schemas** →
   agrega `aylem` a la lista existente (sin quitar los demás) y guarda. *(En este proyecto
   compartido, el panel es la fuente de verdad; por eso NO se expone por SQL.)*
4. Bucket de Storage privado **`aylem`** (ya creado) para adjuntos.
5. Variables de entorno (`.env.local` / Vercel):
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SCHEMA=aylem`,
   `SUPABASE_BUCKET=aylem`.

## Convenciones

- `id uuid primary key default gen_random_uuid()` salvo `configuracion` (clave text).
- `created_at timestamptz default now()` en todas las tablas.
- Historial y financieros **no se borran**: se anulan con `anulada` + `motivo_anulacion`.
- Fechas en **UTC**; se muestran en la zona de la agencia. Montos **por moneda**, sin conversión.

## Tipos (enums)

| Tipo | Valores |
|---|---|
| `rol_usuario` | `cliente`, `operador`, `admin` |
| `tipo_operacion` | `importacion`, `exportacion`, `transito` |
| `modo_transporte` | `maritimo`, `aereo`, `terrestre` |
| `tipo_estado` | `normal`, `pausa`, `cancelada`, `final` |
| `tipo_evento` | `estado`, `observacion` |
| `canal_selectividad` | `verde`, `amarillo`, `rojo` |
| `estado_documento` | `pendiente`, `aceptado`, `rechazado` |
| `contexto_adjunto` | `gestion`, `evento`, `liquidacion`, `pago`, `mensaje` |
| `estado_liquidacion` | `estimada`, `borrador`, `emitida`, `pagada`, `anulada` |
| `destinatario_cobro` | `institucion`, `agencia` |
| `estado_pago` | `reportado`, `verificado`, `rechazado` |
| `estado_cotizacion` | `solicitada`, `respondida`, `aprobada`, `rechazada` |

## Tablas

### Identidad y permisos
- **`empresas`** — empresas cliente. `nombre, id_fiscal, contacto, activo`.
- **`usuarios`** — personas. `empresa_id?, nombre, email (único), password, rol, permisos jsonb?, activo`.
  `password` es texto plano (login básico del demo, no producción). `permisos` null ⇒ usa los
  defaults del rol (ver `lib/permisos.ts`); si tiene valor, es la lista explícita de claves que aplica.

### Catálogos (configurables por admin)
- **`estados_catalogo`** — `nombre, orden, color, notifica_cliente, tipo, activo`.
- **`tipos_documento`** — `nombre, orden, activo`.
- **`conceptos_cobro`** — `nombre, categoria, activo`.
- **`cuentas_bancarias`** — `banco, numero, titular, moneda, instrucciones, activo`.
- **`configuracion`** — `clave (PK), valor, descripcion` (nombre agencia, zona horaria, días de
  gestión fría, estados que requieren pago, SLA objetivo).

### Gestión y timeline
- **`gestiones`** — objeto central. Identificación (`referencia` GES-YYYY-NNNN única,
  `referencia_cliente`, `consignatario`, `tipo_operacion`, `modo`), datos de carga (`bl`, `naviera`,
  `buque_viaje`, `contenedores`, `tipo_contenedor`, `puerto_origen/destino`, `descripcion_mercancia`,
  `proveedor`), fechas (`eta`, `fecha_solicitud`, `fecha_arribo/liberacion/entrega`),
  días libres (`dias_libres`, `fecha_inicio_libres`), `unidades_importadas` (landed cost),
  `public_token` (enlace público). FKs: `empresa_id`, `operador_id?`. El estado actual **se deriva**
  del último evento tipo estado (vista `v_gestion_estado_actual`).
- **`eventos`** — timeline. `tipo (estado|observacion)`, `estado_id?`, `fecha_evento` (editable),
  `observacion`, `canal_selectividad?`, `interno` (oculto al cliente), `usuario_id`, `created_at` (auditoría).
- **`documentos`** — adjuntos (tabla única contextual). `tipo_documento_id?`, `contexto`, `ref_id?`,
  `nombre_archivo`, `storage_path`, `estado`, `motivo_rechazo?`, `version`, `reemplaza_a?`, `subido_por?`.
- **`documentos_requeridos`** — checklist. `tipo_documento_id`, `nota?`, `cumplido`.

### Financiero
- **`liquidaciones`** — `estado (estimada|borrador|emitida|pagada|anulada)`, `motivo_anulacion?`.
- **`liquidacion_lineas`** — `concepto_id?`, `descripcion?`, `monto`, `moneda`, `destinatario`, `anulada`.
- **`pagos`** — `liquidacion_id?`, `monto`, `moneda`, `fecha_pago?`, `banco_medio?`, `referencia?`,
  `comprobante_path?`, `estado (reportado|verificado|rechazado)`, `reportado_por?`, `verificado_por?`.
- **`pago_aplicaciones`** — reparte un pago entre líneas. `pago_id`, `linea_id`, `monto_aplicado`.
  Permite pagos parciales y que un pago cubra varias líneas.

### Colaboración, negocio y satisfacción
- **`notificaciones`** — `usuario_id`, `tipo`, `gestion_id?`, `mensaje`, `leida`.
- **`mensajes`** — chat por gestión. `usuario_id?`, `texto`, `adjunto_id?`, `leido_por jsonb`.
- **`cotizaciones`** — `empresa_id?`, `prospecto_nombre/email?`, `descripcion?`, `estado`, `gestion_id?`
  (al aprobar se convierte en gestión). **`cotizacion_lineas`** — `concepto?`, `monto`, `moneda`.
- **`calificaciones`** — una por gestión (`gestion_id` única). `estrellas 1-5`,
  `dim_comunicacion/tiempos/cobros?`, `comentario?`. No editable tras enviar. ≤3 alerta al admin.

## Vistas

- **`v_gestion_estado_actual`** — estado actual derivado (último evento tipo estado por gestión):
  `gestion_id, estado_id, estado_nombre, estado_color, estado_tipo, fecha_evento`.
- **`v_saldos_liquidacion`** — por liquidación: `total`, `pagado_verificado` (solo pagos verificados),
  `reportado_pendiente`. El **saldo** = `total − pagado_verificado`.
- **`v_tiempos_etapa`** — duración entre eventos de estado consecutivos (métricas/SLA).

## Historial de cambios del esquema

- **Fase A–B** — versión inicial: identidad, permisos, catálogos, gestiones, eventos, documentos,
  requeridos, financiero, notificaciones, mensajes, cotizaciones, calificaciones y las 3 vistas.
  Esquema `aylem` con grants y auto-exposición a PostgREST.
- **Login básico** — `usuarios.password` (texto plano, demo). En bases ya sembradas aplicar
  `migracion-login.sql` (agrega la columna y fija las contraseñas del demo).
