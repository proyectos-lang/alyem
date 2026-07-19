# Instructivo de la plataforma — Agencia de Aduana Aylem Customs

Guía de inicio a fin: qué resuelve la aplicación, quién la usa, dónde empieza el proceso y el
paso a paso de una operación logística hasta su cierre. Pensado para **presentar la aplicación**.

---

## 1. Qué resuelve

Hoy el seguimiento de un trámite aduanero se dispersa entre llamadas, WhatsApp y correos: el
cliente no sabe en qué va su contenedor y la agencia repite la misma información muchas veces.

La plataforma pone a la **agencia y a su cliente sobre una sola fuente de verdad**. Todo lo que
ocurre en una operación —avances, documentos, cobros y pagos— queda registrado en un solo lugar,
con trazabilidad de quién hizo qué y cuándo. **Nadie pregunta "¿en qué va mi contenedor?" porque
la respuesta está siempre en pantalla.**

Tres flujos conviven en cada operación:

| Flujo | Quién registra | Quién consume |
|---|---|---|
| **Operativo** — avance del trámite | La agencia registra eventos | El cliente ve el timeline en vivo |
| **Documental** — BL, factura, DUCA… | Ambas partes suben documentos | Ambas partes, con checklist y validación |
| **Financiero** — impuestos, flete, honorarios | La agencia liquida | El cliente ve el desglose, paga y adjunta comprobante |

---

## 2. Quién usa la aplicación

| Perfil | Quién es | Qué hace |
|---|---|---|
| **Cliente** | Importador/exportador | Solicita operaciones, ve la trazabilidad, sube documentos, ve cobros, reporta pagos, califica |
| **Operador** | Personal de la agencia | Acepta solicitudes, registra cada evento, pide y valida documentos, liquida cobros, verifica pagos |
| **Administrador** | Dueño/gerente de la agencia | Todo lo del operador + usuarios y permisos, catálogos, configuración y reportes del negocio |

### Cómo se entra

En la pantalla de inicio se elige primero el tipo de acceso:

- **Acceso clientes** — cuentas de empresas importadoras/exportadoras.
- **Acceso corporativo** — personal de la agencia (operadores y administración).

Luego **usuario y contraseña**. Cada quien entra a su portal y **solo ve lo que sus permisos
permiten**: si un usuario no tiene permiso sobre un módulo, **ese módulo no aparece en su menú**.

**Cuentas de demostración**

| Acceso | Usuario | Contraseña | Entra a |
|---|---|---|---|
| Corporativo | `admin` | `admin123` | Administración completa |
| Corporativo | `carlos` | `carlos123` | Operación (sin administración) |
| Clientes | `luis` | `luis123` | Importadora del Valle |
| Clientes | `jorge` | `jorge123` | Comercial Pacífico |

> **Aislamiento:** un cliente **solo** ve las operaciones de su propia empresa. Luis nunca ve las
> de Comercial Pacífico, ni siquiera con el enlace directo.

---

## 3. El objeto central: la operación (gestión)

Cada operación representa un trámite/embarque y concentra todo:

- **Identificación**: referencia interna (ej. `GES-2026-0001`), referencia del cliente (su PO),
  tipo (importación/exportación/tránsito) y modo (marítimo/aéreo/terrestre).
- **Carga**: BL o guía, naviera, buque y viaje, contenedor(es), puertos, mercancía, proveedor,
  valor CIF y peso.
- **Fechas clave**: ETA, arribo real, liberación, entrega, y días libres.
- **Relaciones**: empresa cliente, operador asignado, eventos, documentos, liquidación, pagos,
  mensajes y calificación.

El **estado actual siempre se deriva del último evento registrado**. Nunca se edita a mano, así
que el timeline y el estado jamás se contradicen.

---

## 4. Dónde empieza el proceso

La operación puede nacer por **dos caminos**, y ambos terminan en el mismo lugar:

**A) El cliente la solicita** (camino natural)
Portal del cliente → **Mis gestiones → Nueva gestión**. Llena lo que tenga (tipo, modo, BL,
contenedor, puertos, proveedor, ETA, mercancía) y adjunta lo que ya tiene. Queda en estado
**Solicitada** y la agencia recibe la notificación.

**B) La agencia la registra a nombre del cliente**
Cuando el cliente prefiere pedirlo por teléfono o correo: portal corporativo → **Gestiones →
Nueva gestión**, se elige la **empresa cliente** y se llenan los datos. Queda **aceptada y
asignada** al operador que la creó, y el cliente recibe la notificación de que ya existe.

> También existe un tercer origen comercial: **Cotizaciones**. Un cliente o prospecto solicita un
> estimado, la agencia responde con líneas de costo y, al aprobarse, **la cotización se convierte
> automáticamente en una operación**.

---

## 5. Paso a paso de una operación, de inicio a cierre

Las etapas son un **catálogo configurable** por el administrador (nombre, orden, color y si
notifica al cliente). Este es el flujo estándar:

### Paso 1 — Solicitada
El cliente crea la solicitud (o la agencia la registra a su nombre).
**La agencia ve** la solicitud en su **Bandeja de operación**, en "Solicitudes nuevas por aceptar".

### Paso 2 — Aceptada / En proceso
El operador abre la operación con **"Ver operación"**, revisa y presiona **Aceptar**. Queda
asignado como responsable. Aquí mismo **completa los datos faltantes** ("Editar datos") y
**solicita los documentos** que necesita del cliente (checklist por tipo, con nota:
*"la factura debe venir con Incoterm"*).
**El cliente ve** "Documentos pendientes: 2" en su panel y sube lo solicitado. El operador los
**acepta o rechaza con motivo** ("factura ilegible, reenviar escaneada"). Si sube una versión
nueva, la anterior queda como versión previa.

### Paso 3 — En tránsito
El operador registra el zarpe y las novedades del viaje: *"Zarpó de Shanghái"*, *"Trasbordo en
Panamá"*, *"ETA actualizada al 24/07"*.
**El cliente ve cada actualización en su línea de tiempo, sin llamar a nadie.**

### Paso 4 — En puerto
Arribo confirmado. Se registra la fecha real de arribo y arranca el **contador de días libres**:
la operación muestra una cuenta regresiva ("Quedan 3 días libres") y alerta antes de que empiece
a correr almacenaje o demoraje.

### Paso 5 — En documentación
Se elabora y presenta la declaración (DUCA). Los documentos del trámite se adjuntan a la operación.

### Paso 6 — Selectividad (el canal)
Se registra el resultado del canal como atributo del evento:
- **Verde** — levante inmediato.
- **Amarillo** — revisión documental.
- **Rojo** — inspección física.

El operador anota el detalle: *"Canal amarillo: revisión documental programada para mañana 9 a. m."*
Si es rojo, la operación aparece automáticamente en el **Panel de excepciones**.

### Paso 7 — Liquidación de cobros
Con la declaración lista, el operador **emite la liquidación**: impuestos (DAI, ISV), flete,
almacenaje, honorarios y gastos. Cada línea indica **a quién se paga**: a la *institución*
(impuestos) o a la *agencia* (honorarios y gastos adelantados). Se adjuntan los soportes
(boleta de impuestos, factura del naviero).

> Existe también la **pre-liquidación estimada**: un estimado desde el inicio para que el cliente
> aparte flujo de caja. Elimina la sorpresa del monto.

**El cliente recibe la notificación** y ve el desglose completo con las instrucciones de pago
(cuentas bancarias de la agencia).

### Paso 8 — Pago y verificación
El cliente transfiere y **reporta el pago** en la plataforma: indica qué líneas cubre, fecha,
banco, referencia y **adjunta el comprobante (obligatorio)**. El pago queda **Reportado**.

El operador coteja contra el banco y lo marca **Verificado** o **Rechazado con motivo**
("el monto no coincide").

> **Regla clave:** nada se marca como pagado por el solo hecho de subir un comprobante. **El
> comprobante es evidencia, no confirmación**; siempre pasa por verificación de la agencia.

La liquidación muestra en todo momento: **total, pagado verificado, reportado pendiente y saldo**.
Se admiten **pagos parciales** y que un pago cubra varias líneas. Cuando el saldo llega a cero con
todo verificado, la liquidación queda **Pagada**.

### Paso 9 — Liberación
Levante autorizado. Se registra la fecha de liberación.

### Paso 10 — En transporte
Traslado a bodega del cliente, con los datos del transportista en la observación
(*"TransHN, placa PBC-2231"*).

### Paso 11 — En bodega / Entregada
Carga recibida. Se registra la entrega y se adjunta el acta.

### Paso 12 — Cierre
Con documentos completos y pagos verificados, el operador **cierra la operación**. Queda en el
histórico, disponible para reportes de ambas partes.

### Paso 13 — Calificación del servicio
Al quedar entregada o cerrada, el cliente puede **calificar esa operación**: 1 a 5 estrellas más
tres dimensiones rápidas (comunicación, tiempos, claridad de cobros) y un comentario.

> **La función más valiosa:** toda calificación de **3 o menos alerta de inmediato al
> administrador** con el comentario, para dar seguimiento personal antes de que el cliente se
> enfríe. Convierte una queja silenciosa en una llamada a tiempo.

### Paso 14 — Costo real de la importación (landed cost)
Al cierre, con impuestos + flete + honorarios + gastos ya registrados, el cliente indica las
unidades importadas y obtiene su **costo unitario de importación**. Es el reporte que justifica la
plataforma ante la gerencia del importador.

---

## 6. La pantalla de la operación (donde ocurre todo)

Al abrir una operación con **"Ver operación"**, el operador encuentra:

- **Encabezado**: referencia, estado actual, contador de días libres, y las acciones —
  *Avanzar etapa*, *Registrar evento*, *Editar datos*, *Enlace público* y *Reporte PDF*.
- **Métricas**: Valor CIF, Impuestos estimados, Peso y Contenedor.
- **Trazabilidad**: un **stepper horizontal** con todas las etapas —verde con ✓ las completadas,
  ámbar la etapa en curso, gris las pendientes— con sus fechas.
- **Pestañas**:
  - **Operación** — el evento actual en detalle (responsable, aduana, canal) con su mini-historial,
    y los documentos con su estado.
  - **Timeline** — historial cronológico completo de eventos y observaciones.
  - **Documentos** — checklist de requeridos, subida, validación y versiones.
  - **Pagos** — liquidación desglosada, saldos y verificación de pagos.
  - **Mensajes** — conversación ligada a esa operación (en vez de WhatsApp suelto).
  - **Datos** — ficha completa de la carga y el landed cost al cierre.

**"Avanzar etapa"** mueve la operación a la siguiente etapa del catálogo con un clic; **"Registrar
evento"** permite anotar cualquier novedad, con fecha editable (el evento pudo ocurrir antes de
registrarse) y la opción de marcarlo como **nota interna**, que el cliente no ve.

---

## 7. Funciones que hacen la diferencia

| Función | Para qué sirve |
|---|---|
| **Bandeja de operación** | Lo que requiere atención hoy: solicitudes nuevas, pagos por verificar, documentos por revisar |
| **Tablero (kanban)** | La carga de trabajo por etapa, de un vistazo |
| **Panel de excepciones** | Canal rojo, días libres por vencer, operaciones sin actualizar, arribos inminentes. *Que la agencia llame al cliente antes de que el cliente llame a la agencia* |
| **Días libres** | Cuenta regresiva por operación antes de que corra almacenaje o demoraje |
| **Enlace público de seguimiento** | Un link compartible que muestra **solo el timeline** (sin montos ni documentos), para reenviar a gerentes o transportistas, sin necesidad de cuenta |
| **Búsqueda por cualquier referencia** | Por referencia interna, PO del cliente, BL, contenedor o consignatario — como el cliente realmente piensa |
| **Notificaciones** | Campana en la app en cada hito: gestión aceptada, documento requerido o rechazado, liquidación emitida, pago reportado o verificado |
| **Reportes** | Exportación a Excel, reporte PDF con la marca de la agencia, tiempos promedio por etapa y estado financiero (liquidado vs. pagado vs. pendiente) |

---

## 8. Administración (portal corporativo)

- **Empresas** — alta y edición de las empresas cliente.
- **Usuarios y permisos** — crear personas, asignarles usuario y contraseña, y **definir con
  casillas exactamente qué puede hacer cada una**. Lo que no tiene permitido **no le aparece en el
  menú**.
- **Catálogos** — etapas del proceso (nombre, orden, color, si notifica al cliente), tipos de
  documento, conceptos de cobro y cuentas bancarias para instrucciones de pago.
- **Configuración** — nombre de la agencia, zona horaria, días para marcar una operación como
  "fría" y SLA objetivo.
- **Reportes y Satisfacción** — indicadores del negocio y el termómetro del servicio.

---

## 9. Guion sugerido de demostración (10–12 minutos)

1. **Login** — muestra los dos accesos. Entra como **cliente (`luis`)**.
2. **Panel del cliente** — tarjetas de gestiones activas, documentos pendientes y pagos pendientes.
3. **Nueva gestión** — crea una solicitud en vivo; queda como *Solicitada*.
4. **Cambia a corporativo (`carlos`)** — la solicitud aparece en la **Bandeja**.
5. Abre con **"Ver operación"** → muestra el **stepper**, las **métricas** y la pestaña *Operación*.
6. **Acepta**, **solicita documentos** y **registra un evento** (ej. Selectividad, canal amarillo).
7. **Emite la liquidación** con impuestos y honorarios.
8. **Vuelve al cliente** — recibe la notificación, ve el desglose y **reporta el pago con comprobante**.
9. **Vuelve al operador** — **verifica el pago**; el saldo baja a cero.
10. **Avanza etapas** hasta *Entregada* y **cierra** la operación.
11. **Como cliente**, **califica con 2 estrellas** → entra como **`admin`** y muestra la **alerta de
    calificación baja**.
12. Cierra con el **enlace público** de seguimiento y el **Reporte PDF** con la marca de la agencia.

> Consejo: ten abiertas dos ventanas (una con el cliente y otra con el corporativo) para mostrar
> el ida y vuelta en tiempo real sin estar cerrando sesión.

---

## 10. Reglas de negocio que conviene mencionar

- **Auditoría total**: todo registro guarda quién y cuándo. **Nada se elimina**; se anula con motivo.
- **Aislamiento por empresa**: verificado en el servidor en cada consulta, sin excepciones.
- **El estado se deriva del último evento**, nunca se edita directo.
- **Monedas**: cada cobro tiene su moneda (Lempiras y dólares); los totales se muestran por moneda,
  **sin conversión automática** (la conversión genera disputas).
- **Adjuntos**: se sirven con **enlaces temporales firmados**, nunca públicos.
- **Etapas no estrictamente lineales**: se puede registrar cualquier evento en cualquier momento;
  la plataforma sugiere el orden natural y avisa de las excepciones.

---

## 11. Alcance de esta versión

Esta es una **versión demostrativa** funcional de punta a punta. Para producción quedarían pendientes:
autenticación robusta (contraseñas cifradas y recuperación), seguridad a nivel de base de datos,
notificaciones por correo y WhatsApp, y tableros gerenciales en Power BI. La arquitectura ya
contempla esos pasos.

**Deliberadamente fuera de alcance** (pertenecen a plataformas enterprise de implementación larga):
ETAs predictivos con machine learning, congestión portuaria en tiempo real e integración directa
con los sistemas de aduana de cada país.
