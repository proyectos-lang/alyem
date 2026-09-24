# Plan — Flujos de proceso por Tipo de Operación (Alyem Customs)

> Documento de plan para implementación. Generado 2026-09-24. A revisar antes de codificar; se implementará por fases.

## Contexto

Hoy el proceso de una operación es un **flujo único de 14 pasos idéntico para todos los tipos**. El negocio necesita que **cada tipo de operación tenga su propio flujo**: algunos pasos se omiten, otros cambian de nombre, algunos campos se quitan/agregan, y hay pasos nuevos. Requisito central: **un paso que no aplica a un tipo NO debe aparecer ni bloquear el avance** (ni exigir campos, ni frenar el botón "Avanzar").

## Estado actual (confirmado por exploración)

- `tipo_operacion` es un **enum fijo** (5 valores): `importacion, exportacion, transito, duca_f, transito_rapido`. No hay tabla catálogo. Editable libremente.
- **El flujo de 14 pasos NO depende del tipo** en ningún punto. `PASOS` (en `lib/pasos.ts`) es un array plano keyed por nombre; el catálogo `estados_catalogo` define el orden real.
- **El flujo se decide en un único lugar**: la query `estados_catalogo where activo=true and tipo in (normal,final) order by orden`, usada por `avanzarEtapa`/`devolverEtapa` (`lib/actions/gestiones.ts`), el `StepperTrazabilidad` y el `ProcesoPanel`.
- **El bloqueo está en un único lugar**: `faltantesParaAvanzar(gestion, nombreEtapa)` en `lib/pasos.ts`, invocado por `avanzarEtapa` (servidor) y por `proceso-panel`/`avanzar-etapa-paso` (UI).
- **Ya existen dos patrones de "no bloquear"**: (1) tristate `*_aplica === false` → la etapa entera no exige nada; (2) `CampoPaso.condicion: {campo, igual}` → un campo solo se pide si otro campo de la misma etapa cumple (único uso hoy: fechas de "Revisión" solo con canal rojo).
- **NO existen** los campos: `etd`, `aduana_salida_id`, permisos SEPA/ARSA/Banco Central, `fecha_vencimiento` (exportación temporal), `numero_mandamiento`, `numero_fyduca`, ni el paso "Confirmación de despacho de frontera".
- Labels de tipo **duplicados en 8 lugares** (2 incompletos: `app/track/[token]/page.tsx` y `app/api/export/gestiones/route.ts` solo tienen 3 de 5 valores).

## Mapeo confirmado número de paso → nombre real (orden del catálogo)

| # | Nombre real (estado) |
|---|---|
| 1 | Notificación del embarque |
| 2 | Revisión de documentación |
| 3 | Documentos faltantes / ENP |
| 4 | Envío a aforo y digital |
| 5 | Gestión con la naviera |
| 6 | Liquidación de la declaración |
| 7 | Envío del boletín |
| 8 | Pago del boletín |
| 9 | Selectivo |
| 10 | Revisión (solo canal rojo) |
| 11 | Levante de aduana |
| 12 | Entrega del gatepass |
| 13 | Facturación del servicio |
| 14 | Cierre del ciclo (final) |

**Regla global (confirmada): el paso 13 (Facturación) y el 14 (Cierre) siempre permanecen en todos los tipos.**

---

## Decisiones tomadas con el usuario
1. **Motor de flujo por tipo en código** (mapa declarativo en `lib/pasos.ts`): cada tipo lista qué pasos aplica, cuáles omite, y overrides de campos.
2. **Ampliar el enum + separar DUCA F**: nuevos valores `fyduca`, `exportacion_temporal`, `exportacion_definitiva`, `duca_f_importacion`, `duca_f_exportacion`. El `duca_f` actual se conserva como genérico (o se migra a `duca_f_importacion`; ver riesgos).
3. **Crear todos los campos nuevos**: `etd`, `aduana_salida_id`, `permiso_sepa`, `permiso_arsa`, `permiso_banco_central`, `fecha_vencimiento`, `numero_mandamiento`, `numero_fyduca`, y campos del paso "Confirmación de despacho de frontera".
4. **Confirmación de despacho de frontera** = Sí/No + fecha + observación (reemplaza al gatepass en exportaciones/DUCA F).
5. **Alerta de vencimiento (exportación temporal)**: automática por el cron diario, 14 días antes, a operador y cliente, sin repetir.
6. **Opción A — estados nuevos reales en el catálogo** para cada paso renombrado y para los pasos nuevos, **SIN modificar los datos ni el histórico existentes**. Cada variante (Despacho de la carga, Plazo de vencimiento, Confirmación de despacho de frontera, Número de FYDUCA, Pago de FYDUCA, Número de mandamiento) es su propio estado en `estados_catalogo`. Los estados actuales NO se renombran, editan ni borran; las 855 operaciones ya cargadas y sus eventos siguen intactos apuntando a sus estados actuales por `estado_id`. Los estados nuevos solo participan en el flujo efectivo de los tipos que los usan.

---

## Matriz de reglas por tipo

Notación: **omitir** = el paso no aparece ni bloquea. **quitar** = el campo no se muestra. **opcional** = se muestra pero no bloquea. **renombrar** = cambia label/nombre del paso. **agregar** = campo/paso nuevo. "si aplica" = tristate `*_aplica` que, en No, no exige nada.

### Importación (definitiva) — `importacion`
Flujo actual completo (sin cambios). Es la línea base.

### Tránsitos — `transito` (y `transito_rapido`)
- **Omitir pasos 7 y 8** (Envío del boletín, Pago del boletín).
- Resto igual.

### DUCA F Importación — `duca_f_importacion`
- Paso 1: **quitar** `contenedores`.
- Paso 2: **quitar** `marca`, `modelo`, `forma_pago` (+ `forma_pago_otro`).
- **Omitir pasos 3, 4, 5** (Documentos faltantes/ENP, Envío a aforo, Gestión con la naviera).
- Paso 12: **renombrar** "Entrega del gatepass" → **"Despacho de la carga"**.

### Exportación temporal — `exportacion_temporal`
- Paso 1: **quitar** `naviera`; `contenedores` **opcional**; **reemplazar** `eta` (ETA) por `etd` (ETD).
- Paso 2: **quitar** `marca`, `modelo`.
- Paso 3: **quitar** ENP (`numero_np`) → en la práctica el paso queda sin campos requeridos (se puede omitir el paso 3).
- **Omitir paso 5** (Gestión con la naviera).
- Paso 7: **reemplazar** "Envío del boletín" por **"Plazo de vencimiento"** (captura `fecha_vencimiento`) + **alerta 14 días antes** a operador y cliente (cron).
- **Omitir paso 8** (Pago del boletín).
- Paso 12: **reemplazar** gatepass por **"Confirmación de despacho de frontera"**.

### DUCA F Exportación — `duca_f_exportacion`
- Paso 1: **quitar** `naviera`; `contenedores` **opcional**; **reemplazar** `eta` por `etd`.
- **Omitir paso 3**.
- Paso 4: **agregar** "¿aplica?" (tristate `aforo_aplica` o reutilizar patrón `*_aplica` para toda la etapa).
- **Omitir paso 5**.
- Paso 7: **agregar** "¿aplica?" (el boletín es opcional → tristate para no bloquear).
- Paso 8: **agregar** "¿aplica?".
- **Agregar paso nuevo "Número de mandamiento" (si aplica)** después del Pago del boletín (entre paso 8 y 9).
- Paso 12: **reemplazar** gatepass por **"Confirmación de despacho de frontera"**.

### FYDUCA — `fyduca`
- **Omitir pasos 3, 4, 5**.
- Paso 6: **renombrar** "Liquidación de la declaración" → **"Número de FYDUCA"** (captura `numero_fyduca`).
- **Omitir paso 7**.
- Paso 8: **renombrar** "Pago del boletín" → **"Pago de FYDUCA"**.
- **Omitir pasos 9, 10, 11, 12** (Selectivo, Revisión, Levante, Gatepass).
- Quedan: 1, 2, 6(FYDUCA), 8(Pago FYDUCA), 13(Facturación), 14(Cierre).

### Exportación definitiva — `exportacion_definitiva`
- Paso 1: **agregar** `permiso_sepa`, `permiso_arsa`, `permiso_banco_central` (todos **opcionales**); **reemplazar** `eta` por `etd`; **reemplazar** `aduana_id` (aduana de ingreso) por `aduana_salida_id` (aduana de salida).
- **Omitir paso 3**.
- Paso 4: **agregar** "¿aplica?".
- **Omitir pasos 5, 7, 8**.
- Paso 12: **reemplazar** gatepass por **"Confirmación de despacho de frontera"**.

---

## Diseño técnico

### Motor de flujo por tipo (`lib/pasos.ts`)
Con Opción A, cada paso (incluidos los nuevos) es una entrada en `PASOS` (config de campos, keyed por el nombre EXACTO de su estado en `estados_catalogo`). El flujo de cada tipo se declara como una **secuencia ordenada de nombres de estado**:
```ts
// Secuencia de estados por tipo (nombres = estados_catalogo.nombre).
const SECUENCIA_POR_TIPO: Record<TipoOperacion, string[]> = {
  importacion: [ ...los 14 actuales... ],
  transito:    [ ...los 14 menos "Envío del boletín" y "Pago del boletín"... ],
  fyduca:      ["Notificación del embarque","Revisión de documentación","Número de FYDUCA","Pago de FYDUCA","Facturación del servicio","Cierre del ciclo"],
  exportacion_temporal: [..., "Plazo de vencimiento" (en vez de Envío del boletín), ..., "Confirmación de despacho de frontera" (en vez de gatepass), ...],
  // etc.
}
// Overrides de campos por (tipo, paso): quitar / opcional / reemplazar (eta→etd, aduana→salida).
const CAMPOS_POR_TIPO: Partial<Record<TipoOperacion, Record<string, {
  quitar?: string[]; opcionales?: string[]; reemplazar?: {de: string; por: CampoPaso}[]; agregar?: CampoPaso[]
}>>> = { ... }
```
Funciones nuevas puras (client-safe):
- `secuenciaDeTipo(tipo)`: array de nombres de estado del flujo del tipo (con fallback a la secuencia de importación si el tipo no está mapeado).
- `pasoAplicaATipo(tipo, nombrePaso)`: `secuenciaDeTipo(tipo).includes(nombrePaso)`.
- `camposDePaso(tipo, nombrePaso)`: los campos de `PASOS` para ese paso con los overrides de `CAMPOS_POR_TIPO` aplicados (quitar/opcional/reemplazar/agregar).
- `faltantesParaAvanzar(gestion, nombreEtapa)` → **firma cambia** para recibir/leer el tipo y usar `camposDePaso`; si el paso no aplica al tipo, retorna `[]`.

Los estados nuevos existen como filas del catálogo (Opción A), así que tienen `estado_id` real y pueden ser el `estado_id` de un evento — el avance funciona idéntico al actual, solo que la secuencia la marca el tipo.

### Motor de avance (`lib/actions/gestiones.ts`)
- `avanzarEtapa` y `devolverEtapa`: en vez de recorrer el catálogo por `orden` global, construir el **flujo efectivo** = mapear `secuenciaDeTipo(g.tipo_operacion)` (nombres) a las filas de `estados_catalogo` (por nombre → id, tipo, notifica_cliente). El "siguiente" (idx+1) se calcula sobre ese flujo efectivo. Los pasos que no están en la secuencia del tipo se saltan automáticamente. El "Cierre del ciclo" (final) siempre cierra la secuencia.
- `faltantesParaAvanzar` recibe el tipo.
- Esto reemplaza la dependencia del `orden` global del catálogo por la secuencia por tipo, lo que permite intercalar estados nuevos con `orden` alto sin renumerar los existentes.

### Stepper y panel
- `StepperTrazabilidad` y `ProcesoPanel`: recibir `tipoOperacion` y construir su lista con `pasosDeTipo(tipo)` en vez de `PASOS`/catálogo plano. Los pasos omitidos no se renderizan. Renombres aplican al label. Numeración `i+1` sobre el flujo efectivo.
- `paso-form.tsx`: usar `camposDePaso(tipo, nombre)` para los campos visibles.

### Migración de datos — `supabase/31-tipos-operacion-flujos.sql`
- `alter type tipo_operacion add value if not exists` para: `duca_f_importacion`, `duca_f_exportacion`, `exportacion_temporal`, `exportacion_definitiva`, `fyduca`. (Recordar la nota del repo: no usar el valor nuevo en la misma transacción en que se agrega.)
- Columnas nuevas en `gestiones`: `etd date`, `aduana_salida_id uuid references aduanas(id)`, `permiso_sepa text`, `permiso_arsa text`, `permiso_banco_central text`, `fecha_vencimiento date`, `numero_mandamiento text`, `numero_fyduca text`, y para el paso frontera `frontera_despachado boolean`, `frontera_fecha date`, `frontera_observacion text`. Aditivas (`add column if not exists`); añadir a `POSIBLES_SIN_MIGRAR` / arrays `TEXT`/`DATE` de `editarDatosGestion`.
- **Estados nuevos en el catálogo (Opción A elegida), sin tocar los existentes.** Cada paso renombrado o nuevo es una FILA NUEVA en `estados_catalogo`, con su propio `nombre`, `color` y `orden` intercalado (usando decimales/huecos o un `orden` alto reordenado con cuidado). Estados a crear:
  - **Despacho de la carga** (variante del gatepass para DUCA F Importación).
  - **Plazo de vencimiento** (variante del "Envío del boletín" para Exportación temporal; captura `fecha_vencimiento`).
  - **Confirmación de despacho de frontera** (variante del gatepass para exportaciones/DUCA F; `frontera_despachado`/`frontera_fecha`/`frontera_observacion`).
  - **Número de FYDUCA** (variante de "Liquidación"; `numero_fyduca`).
  - **Pago de FYDUCA** (variante de "Pago del boletín").
  - **Número de mandamiento** (paso nuevo tras Pago del boletín, DUCA F Exportación; `numero_mandamiento`).
  - **GARANTÍA de no afectar datos/histórico:** el script SOLO hace `insert ... where not exists` de estos estados nuevos (idempotente). NO ejecuta ningún `update`/`rename`/`delete` sobre `estados_catalogo`, `gestiones` ni `eventos`. Las operaciones actuales conservan su `estado_id`. Los estados existentes conservan su `orden` (los nuevos se intercalan con `orden` fraccionario, p. ej. 12.1, o con un rango nuevo ≥ 100 y el flujo efectivo por tipo define la secuencia real, evitando renumerar los actuales).
  - **El `orden` NO se usa para renumerar los existentes.** Como el flujo efectivo de cada tipo se arma en el motor (`pasosDeTipo`), el orden real de avance lo dicta el array de nombres del tipo, no el `orden` global. Los estados nuevos pueden llevar un `orden` alto (≥100) y aun así colocarse en la posición correcta del flujo del tipo. Así jamás se toca el `orden` de los 14 estados actuales.
  - En el motor, cada tipo lista SU secuencia de estados por nombre (incluyendo los nuevos donde corresponda y omitiendo los que reemplaza). Ej.: Exportación temporal usa "Plazo de vencimiento" en la posición 7 en vez de "Envío del boletín", y "Confirmación de despacho de frontera" en vez de "Entrega del gatepass".

### Labels de tipo (consolidación)
Crear una única fuente `TIPOS_OPERACION` (value → label, y quizá color) en `lib/tipos-operacion.ts` y reemplazar los 8 mapas duplicados (arreglando de paso los 2 incompletos: `track` y `export/gestiones`). Actualizar los selects de alta/edición y los tabs para leer de ahí.

### Alerta de vencimiento (exportación temporal)
En `lib/data/tareas.ts` (motor del cron diario), añadir un chequeo: operaciones `tipo_operacion='exportacion_temporal'` con `fecha_vencimiento` a ≤14 días y no vencidas → `notificarEmpresa` + notificar al operador, con tabla anti-duplicado (como `sla_escalamientos`) para no repetir. Integrar en `app/api/cron/diario`.

---

## Fases de implementación

**Fase 1 — Motor de flujo (sin tipos nuevos aún).** `FLUJOS_POR_TIPO` + `pasosDeTipo`/`camposDePaso`/`pasoAplicaATipo`; adaptar `faltantesParaAvanzar`, `avanzarEtapa`/`devolverEtapa`, `StepperTrazabilidad`, `ProcesoPanel`, `paso-form`. Aplicar SOLO a **Tránsitos** (omitir 7 y 8) como piloto — es la regla más simple y valida todo el motor sin campos nuevos. Sin migración.

**Fase 2 — Consolidar labels de tipo + ampliar enum.** `lib/tipos-operacion.ts` (fuente única), reemplazar los 8 mapas, arreglar los 2 incompletos. Migración `31` con los `add value` del enum. Añadir los tipos nuevos a selects/tabs.

**Fase 3 — Campos nuevos.** Migración de columnas (`etd`, `aduana_salida_id`, permisos, `fecha_vencimiento`, `numero_mandamiento`, `numero_fyduca`, frontera_*). Añadir a `editarDatosGestion` (arrays TEXT/DATE + POSIBLES_SIN_MIGRAR) y a `lib/types.ts`.

**Fase 4 — Estados nuevos (Opción A) + flujos completos por tipo.**
- Migración `supabase/32-estados-variantes.sql`: `insert ... where not exists` de los 6 estados nuevos (Despacho de la carga, Plazo de vencimiento, Confirmación de despacho de frontera, Número de FYDUCA, Pago de FYDUCA, Número de mandamiento) con `orden ≥ 100` y su color. **Solo inserts idempotentes; ningún update/delete sobre estados/gestiones/eventos.** Añadir su config de campos a `PASOS` (keyed por el nombre exacto del estado nuevo).
- Cargar `SECUENCIA_POR_TIPO` y `CAMPOS_POR_TIPO` para: DUCA F Importación, Exportación temporal, DUCA F Exportación, FYDUCA, Exportación definitiva. Cada secuencia usa los estados nuevos donde corresponde y omite los que reemplaza.
- Verificar que una operación existente (importación cerrada) sigue mostrando su flujo intacto.

**Fase 5 — Alerta de vencimiento.** Chequeo en `tareas.ts` + tabla anti-duplicado + integración cron. Notifica operador + cliente 14 días antes.

**Fase 6 — Reportes/analítica.** Exponer los campos nuevos en el reporte (ETD, aduana salida, FYDUCA, vencimiento, mandamiento, permisos) reutilizando el patrón de columnas ya existente.

## Riesgos
1. **Cambiar el flujo efectivo del avance** es el punto más delicado: operaciones ya creadas de un tipo deben seguir avanzando. Mitigación: el flujo efectivo se deriva del tipo actual; las ya cerradas no se tocan.
2. **`duca_f` existente**: decidir si las filas actuales con `duca_f` se migran a `duca_f_importacion` o se dejan como genérico. Recomendación: dejar `duca_f` como alias de importación en el motor, o migrar en la Fase 2 con un `update`.
3. **Opción A (estados nuevos):** la migración debe ser SOLO inserts idempotentes (`where not exists`); prohibido cualquier `update`/`delete` sobre `estados_catalogo`, `gestiones` o `eventos`. Verificar antes y después el conteo de gestiones (855) y que ningún `estado_id` de eventos existentes cambió. El `orden` de los 14 estados actuales NO se toca (los nuevos usan `orden ≥ 100`; la secuencia real la dicta el motor por tipo).
4. **Numeración del stepper** cambia por tipo (menos pasos) — es lo esperado, pero revisar textos que digan "13 pasos".
5. **faltantesParaAvanzar cambia de firma** — hay varios llamadores; actualizar todos.

## Verificación (por fase)
- Fase 1: una operación de tipo Tránsito avanza saltando "Envío/Pago del boletín" sin bloqueo; una de Importación mantiene el flujo completo. `tsc` + `build` limpios.
- Fase 4: crear una de cada tipo nuevo y recorrer su flujo; confirmar que los pasos omitidos no aparecen ni bloquean, los renombres se ven, y los campos nuevos se guardan.
- Fase 5: una exportación temporal con `fecha_vencimiento` a 10 días genera notificación a operador y cliente una sola vez.
