# Especificación funcional — Plataforma de seguimiento aduanero (Alyem Customs)

Documento técnico-funcional detallado del sistema construido. Describe qué hace la aplicación,
qué puede hacer cada tipo de usuario, el detalle de cada módulo, el modelo de datos y el
inventario completo de pantallas. **Uso previsto: elaboración de cotización.**

---

## 1. Resumen ejecutivo

Plataforma web que conecta a una **agencia aduanera** con sus **clientes importadores y
exportadores** alrededor de un objeto central: la **gestión** (el trámite aduanero de una carga o
embarque).

El sistema resuelve la dispersión de información entre llamadas, correos y WhatsApp, consolidando
en una sola fuente de verdad tres flujos que hoy viven separados:

| Flujo | Descripción |
|---|---|
| **Operativo** | El cliente solicita una gestión; la agencia la procesa y registra cada evento; el cliente ve el avance en tiempo real |
| **Documental** | Ambas partes suben y comparten los documentos del trámite, con checklist de requeridos, validación y versionado |
| **Financiero** | La agencia liquida los cobros; el cliente los ve desglosados, reporta el pago con comprobante; la agencia verifica |

**Alcance construido:** 3 portales (cliente, operador, administración) + 1 vista pública sin
autenticación, **24 pantallas**, **20 tablas** y 3 vistas de base de datos, **20 permisos
granulares** administrables por usuario.

---

## 2. Arquitectura y stack técnico

| Capa | Tecnología |
|---|---|
| **Frontend / Backend** | Next.js 16 (App Router, React Server Components, Server Actions) — aplicación full-stack unificada |
| **Lenguaje** | TypeScript |
| **Interfaz** | React 19, Tailwind CSS 4, componentes shadcn/ui sobre Base UI. Sistema de diseño con tokens (colores en oklch, tipografía, radios, sombras) |
| **Base de datos** | PostgreSQL gestionado (Supabase), en esquema aislado propio |
| **Archivos** | Supabase Storage, bucket privado con **URLs firmadas temporales** (los adjuntos nunca son públicos) |
| **Sesión** | Cookie httpOnly; protección de rutas por *proxy* (middleware) de Next |
| **Despliegue** | Preparado para Vercel (repositorio Git listo; variables de entorno documentadas) |

**Decisiones de arquitectura relevantes:**
- Toda la lógica de negocio y el acceso a datos ocurre **en el servidor** (Server Components y
  Server Actions). El navegador nunca recibe credenciales de base de datos.
- El **aislamiento por empresa** y la **validación de permisos** se aplican en cada consulta y en
  cada operación de escritura del servidor.
- Renderizado dinámico por petición: los datos siempre están frescos.

---

## 3. Modelo de datos

**20 tablas** organizadas en cinco bloques, más **3 vistas** de apoyo.

### 3.1 Identidad y permisos
| Tabla | Contenido |
|---|---|
| `empresas` | Empresas cliente: nombre, identificación fiscal, contacto, estado activo |
| `usuarios` | Personas: nombre, usuario de acceso, contraseña, correo (opcional), rol, empresa asociada, permisos personalizados, estado activo |

### 3.2 Catálogos configurables
| Tabla | Contenido |
|---|---|
| `estados_catalogo` | Etapas del proceso: nombre, orden, color, si notifica al cliente, tipo (normal / pausa / cancelada / final) |
| `tipos_documento` | Tipos de documento (BL, factura comercial, lista de empaque, certificado de origen, DUCA, póliza, permiso, comprobante, otro) |
| `conceptos_cobro` | Conceptos de cobro con categoría (impuesto, flete, gasto, honorario, otro) |
| `cuentas_bancarias` | Cuentas de la agencia para instrucciones de pago (banco, número, titular, moneda, instrucciones) |
| `configuracion` | Parámetros del sistema (nombre de la agencia, zona horaria, días de "gestión fría", SLA objetivo, estados que exigen pago) |

### 3.3 Gestión y trazabilidad
| Tabla | Contenido |
|---|---|
| `gestiones` | Objeto central. Identificación (referencia interna autogenerada `GES-AAAA-NNNN`, referencia del cliente/PO, consignatario, tipo de operación, modo de transporte), datos de carga (BL/guía, naviera, buque y viaje, contenedores, tipo de contenedor, puertos origen/destino, mercancía, proveedor, valor CIF, peso), fechas (solicitud, ETA, arribo, liberación, entrega), días libres, unidades importadas y token de seguimiento público |
| `eventos` | Bitácora de trazabilidad: tipo (cambio de estado u observación), estado asociado, fecha del evento (editable), observación, canal de selectividad, marca de nota interna, usuario y fecha de registro (auditoría) |
| `documentos` | Adjuntos contextuales: tipo, nombre, ruta en almacenamiento, estado (pendiente/aceptado/rechazado), motivo de rechazo, versión, documento al que reemplaza, quién subió |
| `documentos_requeridos` | Checklist de documentos solicitados al cliente, con nota y marca de cumplido |

### 3.4 Financiero
| Tabla | Contenido |
|---|---|
| `liquidaciones` | Liquidación por gestión, con estado (estimada / borrador / emitida / pagada / anulada) y motivo de anulación |
| `liquidacion_lineas` | Líneas de cobro: concepto, descripción, monto, moneda, destinatario (institución o agencia), marca de anulación |
| `pagos` | Pagos reportados: monto, moneda, fecha, banco/medio, referencia, comprobante, estado (reportado/verificado/rechazado), quién reportó y quién verificó |
| `pago_aplicaciones` | Distribución de cada pago entre líneas de la liquidación (permite pagos parciales y que un pago cubra varias líneas) |

### 3.5 Colaboración, negocio y satisfacción
| Tabla | Contenido |
|---|---|
| `notificaciones` | Avisos in-app por usuario, con tipo, mensaje, gestión asociada y marca de leído |
| `mensajes` | Conversación (chat) ligada a cada gestión |
| `cotizaciones` + `cotizacion_lineas` | Solicitudes de cotización de clientes o prospectos, con líneas de estimado y conversión a gestión |
| `calificaciones` | Una por gestión: estrellas (1-5), tres dimensiones (comunicación, tiempos, claridad de cobros) y comentario |

### 3.6 Vistas
| Vista | Función |
|---|---|
| `v_gestion_estado_actual` | **Estado actual derivado** del último evento de estado de cada gestión |
| `v_saldos_liquidacion` | Total, pagado verificado y reportado pendiente por liquidación |
| `v_tiempos_etapa` | Duración entre etapas consecutivas (métricas y SLA) |

---

## 4. Autenticación y control de acceso

### 4.1 Inicio de sesión
Pantalla de acceso con **selección previa de audiencia**:
- **Acceso clientes** — cuentas de empresas importadoras/exportadoras.
- **Acceso corporativo** — personal de la agencia (operadores y administración).

Se ingresa con **usuario y contraseña**. El sistema valida además que la cuenta corresponda a la
audiencia elegida (un cliente no puede entrar por el acceso corporativo ni viceversa) y que el
usuario esté activo. Sesión mediante cookie httpOnly; cierre de sesión desde el menú de usuario.

**Protección de rutas:** todas las pantallas exigen sesión, excepto el login y el enlace público
de seguimiento.

### 4.2 Sistema de permisos (20 permisos granulares)

Cada usuario tiene un **rol** que define permisos por defecto, y el administrador puede
**personalizar permiso por permiso** con casillas. **Si un usuario no tiene un permiso, el módulo
correspondiente no aparece en su menú** (no se oculta el botón: desaparece la entrada de navegación).

| Grupo | Permisos |
|---|---|
| **Gestiones** | Crear gestiones · Ver todas las gestiones · Aceptar/rechazar solicitudes · Editar datos de la carga · Registrar eventos |
| **Documentos** | Subir documentos · Solicitar documentos · Aceptar/rechazar documentos |
| **Finanzas** | Crear/editar liquidaciones · Reportar pagos · Verificar pagos |
| **Colaboración** | Enviar mensajes |
| **Negocio** | Solicitar cotizaciones · Responder cotizaciones · Calificar el servicio |
| **Reportes** | Ver reportes |
| **Administración** | Administrar empresas · Administrar usuarios y permisos · Administrar catálogos · Configuración de reglas |

### 4.3 Aislamiento de datos
Un usuario cliente **solo accede a las gestiones, documentos, pagos y mensajes de su propia
empresa**. La restricción se aplica en el servidor en cada consulta y también al abrir un registro
por enlace directo (devuelve "no tienes acceso"). No depende del ocultamiento en la interfaz.

---

## 5. Qué hace cada usuario

### 5.1 CLIENTE (empresa importadora/exportadora)

**Puede:**
- **Crear solicitudes de gestión** con los datos que tenga disponibles (tipo de operación, modo de
  transporte, referencia propia/PO, BL o guía, naviera, contenedores, puertos, proveedor, ETA,
  descripción de la mercancía).
- **Ver la trazabilidad** de cada embarque: stepper de etapas y línea de tiempo cronológica con
  todas las observaciones de la agencia.
- **Consultar el estado actual** de todas sus operaciones, con buscador por cualquier referencia
  (referencia interna, su PO, BL, contenedor, consignatario o mercancía).
- **Subir documentos** contra el checklist de lo solicitado por la agencia, y ver cuáles fueron
  aceptados o rechazados y por qué.
- **Ver la liquidación desglosada** por concepto, moneda y destinatario, con el saldo actualizado y
  las instrucciones de pago (cuentas bancarias de la agencia).
- **Reportar pagos**: seleccionar qué líneas cubre y con qué monto, indicar fecha, banco y
  referencia, y **adjuntar el comprobante (obligatorio)**.
- **Conversar** con la agencia en el chat ligado a cada operación.
- **Solicitar cotizaciones** y ver el estimado que responde la agencia.
- **Calificar el servicio** al cierre de cada operación.
- **Ver su costo unitario de importación** (landed cost) indicando las unidades importadas.
- **Exportar a Excel** sus operaciones y **descargar un reporte PDF** por operación.
- **Recibir notificaciones** in-app de cada hito.

**No puede:** modificar estados ni eventos, editar cobros, ver notas internas de la agencia, ni
acceder a información de otras empresas.

### 5.2 OPERADOR (personal de la agencia)

**Puede todo lo operativo:**
- **Ver todas las gestiones** de la agencia, con buscador y filtros.
- **Bandeja de operación**: solicitudes nuevas por aceptar, gestiones activas, pagos por verificar
  y documentos por revisar.
- **Aceptar o rechazar** solicitudes (con motivo). Al aceptar queda asignado como responsable.
- **Crear gestiones a nombre de un cliente** (cuando el cliente no las registra desde su portal):
  se selecciona la empresa y la operación queda aceptada y asignada automáticamente.
- **Registrar eventos**: cambio de etapa u observación, con **fecha editable** (el hecho pudo
  ocurrir antes de registrarse), observación libre, **canal de selectividad** (verde/amarillo/rojo)
  y opción de marcarlo como **nota interna** (invisible para el cliente).
- **Avanzar etapa** con un clic (mueve la operación a la siguiente etapa del catálogo).
- **Editar los datos de la carga** (BL, naviera, buque, contenedores, puertos, fechas, días libres,
  valor CIF, peso, unidades).
- **Solicitar documentos** al cliente (checklist por tipo, con nota) y **aceptar o rechazar** los
  recibidos con motivo. Subir documentos propios.
- **Crear y editar liquidaciones**: agregar líneas por concepto, monto, moneda y destinatario;
  emitir, anular líneas o la liquidación completa (siempre con motivo, nunca por borrado).
- **Verificar o rechazar pagos** reportados por el cliente, cotejando contra el comprobante.
- **Responder cotizaciones** y **convertirlas en gestión** al aprobarlas.
- **Tablero kanban** por etapa y **panel de excepciones**.
- **Copiar el enlace público** de seguimiento para compartir con terceros.
- **Ver reportes** y exportar.

**No puede** (por defecto): administrar empresas, usuarios, catálogos ni configuración.

### 5.3 ADMINISTRADOR (dueño/gerente de la agencia)

**Todo lo del operador, más:**
- **Empresas cliente**: alta, edición, activación/desactivación, con conteo de usuarios.
- **Usuarios y permisos**: crear personas, asignar usuario y contraseña, rol y empresa, **definir
  permisos individuales con casillas** (o usar los del rol), y activar/desactivar cuentas.
- **Catálogos**: etapas del proceso (nombre, orden, color, si notifica al cliente, tipo), tipos de
  documento, conceptos de cobro y cuentas bancarias.
- **Configuración**: nombre de la agencia (se refleja en toda la app y en los PDF), zona horaria,
  días para marcar una gestión como "fría", SLA objetivo y estados que exigen pago.
- **Reportes del negocio**: gestiones por estado y por empresa, tiempos promedio por etapa,
  liquidado vs. pagado vs. pendiente por moneda.
- **Panel de satisfacción**: promedio general y por dimensión, listado de comentarios y **alerta de
  calificaciones bajas** pendientes de atender.

---

## 6. Detalle de módulos

### 6.1 Gestiones y trazabilidad
- Referencia interna **autogenerada** por año (`GES-2026-0001`).
- **Estado actual derivado del último evento**: nunca se edita directamente, por lo que el estado y
  la línea de tiempo jamás se contradicen.
- **Etapas configurables**: el flujo estándar incluye Solicitada → Aceptada/En proceso → En tránsito
  → En puerto → En documentación → Selectividad → Liberación → En transporte → En bodega/Entregada →
  Cerrada, más los estados transversales En pausa y Cancelada. El administrador puede renombrar,
  reordenar, recolorear y agregar etapas.
- **Etapas no estrictamente lineales**: se puede registrar cualquier evento en cualquier momento; el
  sistema sugiere el orden natural.
- **Stepper horizontal de trazabilidad**: etapas completadas (verde con ✓), en curso (ámbar) y
  pendientes (gris), con fechas y barra de progreso.
- **Línea de tiempo cronológica** con estado, canal de selectividad, observación, autor y fecha.
- **Notas internas** visibles solo para la agencia.
- **Métricas de operación**: Valor CIF, Impuestos estimados (derivados de la liquidación), Peso y
  Contenedor.
- **Búsqueda universal** por referencia interna, PO del cliente, BL, contenedor, consignatario o
  mercancía.

### 6.2 Documentos
- Subida de PDF e imágenes a almacenamiento privado; descarga mediante **enlaces firmados
  temporales**.
- **Checklist de documentos requeridos** por tipo, con nota explicativa; indicador de pendientes
  visible para el cliente y en la operación.
- **Flujo de validación**: pendiente → aceptado / rechazado con motivo.
- **Versionado**: al subir un documento del mismo tipo, el anterior queda como versión previa y el
  nuevo se marca con su número de versión.
- Los documentos subidos por la agencia entran directamente como aceptados.

### 6.3 Financiero
- **Liquidación por gestión** con estados: *estimada* (pre-liquidación para que el cliente aparte
  flujo de caja), *borrador* (no visible al cliente), *emitida*, *pagada*, *anulada*.
- **Líneas de cobro** por concepto, con descripción, monto, **moneda** y **destinatario**
  (institución o agencia).
- **Totales por moneda, sin conversión automática** (evita disputas cambiarias).
- **Reporte de pago por el cliente** con distribución del monto entre líneas y **comprobante
  obligatorio**.
- **Pagos parciales** y pagos que cubren varias líneas.
- **Verificación por la agencia**: solo los pagos verificados cuentan como pagados. Un comprobante
  es evidencia, no confirmación.
- **Saldos en vivo**: total, pagado verificado, reportado pendiente y saldo.
- **Cierre automático** de la liquidación a *pagada* cuando el saldo llega a cero.
- **Historial inmutable**: liquidaciones, líneas y pagos no se borran; se anulan con motivo.

### 6.4 Notificaciones
Campana con contador de no leídas y opción de marcar todas como leídas. Se generan en:
solicitud nueva, gestión aceptada o rechazada, evento visible/cambio de estado (según el catálogo),
documento requerido, documento subido por el cliente, documento rechazado, liquidación emitida o
línea agregada, pago reportado, pago verificado o rechazado, mensaje nuevo, cotización solicitada,
respondida o aprobada, y **calificación baja**.

### 6.5 Mensajería
Chat por operación, con historial y autoría, que sustituye las conversaciones sueltas por WhatsApp
y deja la trazabilidad ligada al embarque.

### 6.6 Cotizaciones
El cliente o un prospecto solicita un estimado; la agencia responde con líneas de concepto, monto y
moneda; al aprobarse, **la cotización se convierte automáticamente en una gestión** ya aceptada y
asignada, con su evento inicial.

### 6.7 Satisfacción
- Calificación **una sola vez por gestión** (no editable), disponible al quedar entregada o cerrada.
- 1 a 5 estrellas + tres dimensiones (comunicación, tiempos, claridad de cobros) + comentario.
- **Alerta inmediata al administrador ante calificaciones de 3 o menos**, con el comentario, para
  dar seguimiento antes de perder al cliente.
- Panel con promedios general y por dimensión, y listado de comentarios recientes.

### 6.8 Inteligencia operativa
- **Tablero kanban** con las operaciones agrupadas por etapa.
- **Panel de excepciones**: canal rojo, días libres por vencer o vencidos, operaciones sin
  actualizar más de X días ("gestión fría") y arribos inminentes.
- **Contador de días libres**: cuenta regresiva por operación antes de que empiece a correr
  almacenaje o demoraje, con señalización por color.

### 6.9 Reportes
- **Exportación a Excel** (CSV) de las operaciones, respetando el alcance del usuario.
- **Reporte PDF con la marca de la agencia** por operación: ficha de la carga, estado financiero por
  moneda e historial completo.
- **Reportes de agencia**: gestiones por estado y por empresa, **tiempos promedio por etapa**,
  liquidado vs. pagado vs. pendiente por moneda.
- **Reportes de cliente**: total de operaciones, entregadas/cerradas y días promedio de arribo a
  entrega.
- **Landed cost**: costo unitario de importación al cierre.

### 6.10 Enlace público de seguimiento
Cada operación tiene un enlace con token único que muestra **solo la línea de tiempo** (sin montos,
sin documentos, sin datos internos), reenviable a gerencia o transportistas **sin necesidad de
cuenta**.

---

## 7. Inventario de pantallas (24)

| Portal | Pantalla | Función |
|---|---|---|
| **Acceso** | `/login` | Selección de audiencia + usuario y contraseña |
| **Acceso** | `/` | Redirección automática al portal según rol |
| **Cliente** | `/panel` | Dashboard: activas, documentos pendientes, pagos pendientes, novedades |
| **Cliente** | `/panel/gestiones` | Listado con buscador y acción "Ver operación" |
| **Cliente** | `/panel/gestiones/nueva` | Alta de solicitud |
| **Cliente** | `/panel/cotizaciones` | Solicitud y seguimiento de cotizaciones |
| **Cliente** | `/panel/reportes` | Indicadores, exportación y PDF por operación |
| **Agencia** | `/agencia` | Bandeja de operación |
| **Agencia** | `/agencia/gestiones` | Listado completo con buscador |
| **Agencia** | `/agencia/gestiones/nueva` | Alta de gestión a nombre de un cliente |
| **Agencia** | `/agencia/kanban` | Tablero por etapa |
| **Agencia** | `/agencia/excepciones` | Panel de excepciones |
| **Agencia** | `/agencia/cotizaciones` | Responder y convertir cotizaciones |
| **Compartida** | `/g/[id]` | **Detalle de operación**: breadcrumb, métricas, stepper y pestañas Operación · Timeline · Documentos · Pagos · Mensajes · Datos |
| **Admin** | `/admin` | Resumen del negocio |
| **Admin** | `/admin/empresas` | Empresas cliente |
| **Admin** | `/admin/usuarios` | Usuarios y permisos |
| **Admin** | `/admin/catalogos/estados` | Etapas, tipos de documento, conceptos y cuentas |
| **Admin** | `/admin/config` | Parámetros del sistema |
| **Admin** | `/admin/reportes` | Reportes operativos y financieros |
| **Admin** | `/admin/satisfaccion` | Satisfacción y alertas |
| **Transversal** | `/reporte/[id]` | Reporte PDF con marca |
| **Público** | `/track/[token]` | Seguimiento sin autenticación |
| **Servicio** | `/api/export/gestiones` | Exportación a Excel |

---

## 8. Reglas de negocio transversales

1. **Auditoría total**: todo registro guarda quién lo hizo y cuándo. **Nada se elimina**
   físicamente; se anula con motivo y permanece en el historial.
2. **Aislamiento por empresa**: verificado en el servidor en cada operación, sin excepciones.
3. **El estado actual se deriva del último evento**; no se edita directamente.
4. **Fecha del evento editable** (el hecho pudo ocurrir antes del registro), pero la fecha de
   registro es inmutable y queda como auditoría.
5. **Monedas**: cada línea tiene su moneda; los totales se muestran por moneda **sin conversión
   automática**.
6. **Fechas** almacenadas en UTC y mostradas en la zona horaria de la agencia.
7. **Adjuntos**: PDF e imágenes, servidos con enlaces temporales firmados, nunca públicos.
8. **Un pago no confirma nada por sí mismo**: siempre requiere verificación de la agencia.
9. **Una calificación por gestión**, no editable tras enviarse.
10. **Visibilidad selectiva**: los eventos internos y las liquidaciones en borrador no son visibles
    para el cliente.

---

## 9. Estado del desarrollo

**Construido y funcionando de punta a punta** (verificado contra base de datos real): los 3 portales,
las 24 pantallas, los 20 permisos, el flujo completo desde la solicitud hasta el cierre y la
calificación, incluidos documentos, liquidación, pagos, notificaciones, mensajería, cotizaciones,
kanban, excepciones, reportes, exportación, PDF y enlace público.

### Pendiente para un entorno productivo
| Tema | Detalle |
|---|---|
| **Seguridad de autenticación** | Contraseñas cifradas (hash), recuperación de contraseña, política de contraseñas, expiración de sesión, doble factor opcional |
| **Seguridad de datos** | Políticas de seguridad a nivel de base de datos (RLS) como segunda barrera |
| **Notificaciones externas** | Correo electrónico y/o WhatsApp Business (requiere costo de servicio y aprobación de plantillas) |
| **Inteligencia documental** | Pre-llenado automático de datos leyendo factura/BL con IA |
| **Analítica avanzada** | Tableros gerenciales (Power BI u similar) sobre la misma base |
| **Operación** | Respaldos, monitoreo, ambiente de pruebas separado, carga inicial de datos reales y capacitación |

### Deliberadamente fuera de alcance
ETAs predictivos con machine learning, congestión portuaria en tiempo real e integración directa con
los sistemas informáticos de aduana de cada país: pertenecen a plataformas *enterprise* con
implementaciones de meses y costos de seis cifras.

---

## 10. Consideraciones para la cotización

- **Naturaleza actual**: versión demostrativa completamente funcional, apta para presentar a
  clientes y validar el proceso. No es todavía una instalación endurecida para producción.
- **Multi-empresa**: el sistema ya soporta múltiples empresas cliente con aislamiento entre ellas;
  no requiere una instancia por cliente.
- **Configurabilidad sin programación**: etapas, tipos de documento, conceptos de cobro, cuentas
  bancarias, nombre de la agencia y reglas se administran desde la propia aplicación, sin
  intervención técnica.
- **Multimodal**: soporta operaciones marítimas, aéreas y terrestres, y de importación, exportación
  y tránsito.
- **Escalabilidad**: base PostgreSQL gestionada y despliegue en plataforma serverless; el costo de
  infraestructura escala con el uso.
- **Idioma y localización**: español, con formato de moneda y fechas de Honduras (Lempiras y
  dólares); adaptable a otros países.
