// Configuración de los campos que se capturan en cada paso del proceso.
// La clave es el nombre de la etapa (estados_catalogo.nombre).

export type TipoCampo = "text" | "textarea" | "lista" | "num" | "date" | "datetime" | "tristate" | "select" | "aduana"

export interface CampoPaso {
  name: string
  label: string
  tipo: TipoCampo
  opciones?: { value: string; label: string }[]
  // Para tipo "lista" (multivalor con botón +): texto del botón y del input.
  addLabel?: string
  placeholder?: string
  // El campo solo se muestra/pide si otro campo de la etapa cumple una condición
  // (ej. los campos de DUCA T solo si `duca_t` = true).
  condicion?: { campo: string; igual: boolean | string }
}

const FORMA_PAGO = [
  { value: "transferencia_pagada", label: "Transferencia pagada" },
  { value: "transferencia_pendiente", label: "Transferencia pendiente de pago" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "otros", label: "Otros" },
]
const CANAL = [
  { value: "verde", label: "Verde — levante directo" },
  { value: "amarillo", label: "Amarillo — espera de levante" },
  { value: "rojo", label: "Rojo — inspección" },
]
const FACTURA = [
  { value: "en_proceso", label: "Factura en proceso" },
  { value: "enviada", label: "Factura enviada" },
]

// Quién captura cada paso: 'cliente' | 'alyem'. Y sus campos.
export interface Paso {
  nombre: string
  responsable: "cliente" | "alyem"
  descripcion: string
  campos: CampoPaso[]
  docs?: string[] // tipos de documento asociados al paso (por nombre)
}

export const PASOS: Paso[] = [
  {
    nombre: "Notificación del embarque",
    responsable: "cliente",
    descripcion: "El cliente informa el embarque y carga la documentación base.",
    campos: [
      { name: "naviera", label: "Naviera", tipo: "text" },
      { name: "eta", label: "ETA", tipo: "date" },
      { name: "aduana_id", label: "Aduana de ingreso", tipo: "aduana" },
      { name: "proveedor", label: "Proveedor", tipo: "text" },
      { name: "numero_factura", label: "Número(s) de factura", tipo: "lista", addLabel: "Agregar factura", placeholder: "N.º de factura" },
      { name: "numero_orden_compra", label: "Número de orden de compra", tipo: "text" },
      { name: "numero_pedido", label: "Número de pedido", tipo: "text" },
      { name: "contenedores", label: "Contenedor(es)", tipo: "lista", addLabel: "Agregar contenedor", placeholder: "N.º de contenedor" },
    ],
    docs: [
      "Documento de transporte", "Factura comercial", "Traducción / descripción de la carga",
      "Póliza de seguro", "Comprobante de pago al proveedor", "Permiso ARSA", "Certificado de origen (TLC)",
      "Permiso fitosanitario", "Permiso SEN", "Permiso UTOH", "Orden de inspección", "Ficha técnica",
      "Declaración de movimiento comercial (Panamá)", "Certificado de reexportación (Panamá)",
    ],
  },
  {
    nombre: "Revisión de documentación",
    responsable: "alyem",
    descripcion: "Alyem revisa contra el checklist y registra los datos de la operación.",
    campos: [
      { name: "valor_fob", label: "Valor FOB", tipo: "num" },
      { name: "valor_flete", label: "Valor del flete", tipo: "num" },
      { name: "valor_seguro", label: "Valor del seguro", tipo: "num" },
      { name: "otros_gastos", label: "Otros gastos", tipo: "num" },
      { name: "termino_compra", label: "Término de compra (Incoterm)", tipo: "text" },
      { name: "descripcion_carga", label: "Descripción de la carga", tipo: "textarea" },
      { name: "origen_carga", label: "Origen(es) de la carga", tipo: "lista", addLabel: "Agregar origen", placeholder: "Origen" },
      { name: "marca", label: "Marca", tipo: "text" },
      { name: "modelo", label: "Modelo(s) — uno por línea", tipo: "textarea" },
      { name: "forma_pago", label: "Forma de pago", tipo: "select", opciones: FORMA_PAGO },
      { name: "forma_pago_otro", label: "Forma de pago (otros)", tipo: "text" },
      { name: "carta_porte", label: "Número de BL / carta de porte", tipo: "text" },
    ],
  },
  {
    nombre: "Documentos faltantes / ENP",
    responsable: "alyem",
    descripcion: "Si falta documentación se solicita al cliente; se gestiona y registra la ENP.",
    campos: [{ name: "numero_np", label: "Número de NP", tipo: "text" }],
  },
  {
    nombre: "Envío a aforo y digital",
    responsable: "alyem",
    descripcion: "Con la documentación completa se envía a aforo y digital.",
    campos: [
      { name: "aforo", label: "Aforo", tipo: "tristate" },
      { name: "digital", label: "Digital", tipo: "tristate" },
      { name: "previa", label: "Previa", tipo: "tristate" },
      // Campos DUCA T: siempre visibles y opcionales (no bloquean el avance).
      { name: "razon_social", label: "Razón social (DUCA T)", tipo: "text" },
      { name: "rtn", label: "RTN (DUCA T)", tipo: "text" },
      { name: "kilos", label: "Kilos (DUCA T)", tipo: "num" },
      { name: "bultos", label: "Bultos (DUCA T)", tipo: "num" },
      { name: "numeros_factura", label: "Números de factura (DUCA T)", tipo: "text" },
    ],
  },
  {
    nombre: "Gestión con la naviera",
    responsable: "alyem",
    descripcion: "Gestión de documentos y condiciones ante la naviera (si aplica).",
    campos: [
      { name: "naviera_aplica", label: "¿Aplica?", tipo: "tristate" },
      { name: "manifiesto_presentado", label: "Manifiesto presentado", tipo: "tristate" },
      { name: "liberacion", label: "Liberación", tipo: "tristate" },
      { name: "doc_transporte_original", label: "Documento de transporte original recibido", tipo: "tristate" },
      { name: "fecha_fin_dias_libres", label: "Fin de días libres (se calculan solos)", tipo: "date" },
      { name: "naviera_observaciones", label: "Observaciones", tipo: "textarea" },
    ],
    docs: ["BL original", "Listado de sellos", "Manifiesto"],
  },
  {
    nombre: "Liquidación de la declaración",
    responsable: "alyem",
    descripcion: "Se registra el correlativo de la liquidación.",
    campos: [{ name: "correlativo_liquidacion", label: "Correlativo de liquidación", tipo: "text" }],
  },
  {
    nombre: "Envío del boletín",
    responsable: "alyem",
    descripcion: "Se envía el boletín al cliente.",
    campos: [{ name: "boletin_enviado", label: "Boletín enviado", tipo: "tristate" }],
  },
  {
    nombre: "Pago del boletín",
    responsable: "cliente",
    descripcion: "El cliente paga y adjunta el comprobante; Alyem verifica.",
    campos: [{ name: "boletin_pagado", label: "Boletín pagado (verificado)", tipo: "tristate" }],
    docs: ["Comprobante de pago del boletín"],
  },
  {
    nombre: "Selectivo",
    responsable: "alyem",
    descripcion: "La aduana asigna el canal; Alyem lo registra e informa al cliente.",
    campos: [{ name: "canal_selectivo", label: "Canal", tipo: "select", opciones: CANAL }],
  },
  {
    nombre: "Revisión",
    responsable: "alyem",
    descripcion: "Aplica solo con canal rojo. Con verde pasa directo al levante; con amarillo, levante en proceso.",
    // Automático por canal: solo aplica (pide fechas) cuando el Selectivo fue rojo.
    campos: [
      { name: "fecha_revision", label: "Fecha de revisión", tipo: "date", condicion: { campo: "canal_selectivo", igual: "rojo" } },
      { name: "fecha_aprobacion_aduana", label: "Fecha de aprobación aduana", tipo: "date", condicion: { campo: "canal_selectivo", igual: "rojo" } },
      { name: "fecha_revision_opc", label: "Fecha de revisión por OPC", tipo: "date", condicion: { campo: "canal_selectivo", igual: "rojo" } },
      { name: "fecha_posicionamiento_equipos", label: "Fecha de posicionamiento de equipos", tipo: "date", condicion: { campo: "canal_selectivo", igual: "rojo" } },
    ],
  },
  {
    nombre: "Levante de aduana",
    responsable: "alyem",
    descripcion: "Se registra la fecha de levante.",
    campos: [{ name: "fecha_levante", label: "Fecha de levante", tipo: "date" }],
  },
  {
    nombre: "Entrega del gatepass",
    responsable: "alyem",
    descripcion: "Aplica solo para Puerto Cortés.",
    campos: [
      { name: "gatepass_aplica", label: "¿Aplica?", tipo: "tristate" },
      { name: "transporte_naviera", label: "Transporte de la naviera", tipo: "tristate" },
      { name: "gatepass_entregado", label: "Gatepass entregado", tipo: "tristate" },
      { name: "gatepass_fecha_hora", label: "Fecha y hora del gate pass", tipo: "datetime" },
      { name: "gatepass_observacion", label: "Observaciones", tipo: "textarea" },
    ],
  },
  {
    nombre: "Facturación del servicio",
    responsable: "alyem",
    descripcion: "Estado de la factura del servicio; al enviarla se adjunta.",
    campos: [{ name: "estado_factura", label: "Estado de la factura", tipo: "select", opciones: FACTURA }],
    docs: ["Factura del servicio"],
  },
  {
    nombre: "Cierre del ciclo",
    responsable: "cliente",
    descripcion: "El cliente confirma la recepción y califica el servicio.",
    campos: [],
  },
]

export function pasoPorNombre(nombre: string | null | undefined): Paso | undefined {
  if (!nombre) return undefined
  return PASOS.find((p) => p.nombre === nombre)
}

// ---------------------------------------------------------------------------
// Reglas de avance y de propiedad de campos por etapa.
// Fuente única de verdad usada por la UI (botón de avance / alertas) y por el
// servidor (guardas en avanzarEtapa y editarDatosGestion).
// ---------------------------------------------------------------------------

// Campos que NO se exigen para avanzar (observaciones, condicionales, heredados
// o autocalculados). Ajustar aquí para relajar/endurecer la exigencia por campo.
export const OPCIONALES_AVANCE = new Set<string>([
  "naviera_observaciones",
  "gatepass_observacion",
  "forma_pago_otro",
  "previa",
  "descripcion_carga", // heredado del intake (Paso 1)
  "numero_orden_compra", // opcional
  "numero_pedido", // opcional
  "fecha_fin_dias_libres", // se calcula solo / puede no aplicar
  // Campos DUCA T: opcionales, no bloquean el avance.
  "razon_social",
  "rtn",
  "kilos",
  "bultos",
  "numeros_factura",
  // Revisión: la fecha de revisión general es requerida; las específicas, opcionales.
  "fecha_aprobacion_aduana",
  "fecha_revision_opc",
  "fecha_posicionamiento_equipos",
  // Gate pass: fecha/hora es opcional.
  "gatepass_fecha_hora",
  // NP (ENP): opcional para avanzar; puede quedar pendiente y diligenciarse después.
  "numero_np",
])

// Identificadores oficiales que NO se pueden editar una vez registrados (por nadie):
// BL (carta_porte), número de declaración (correlativo_liquidacion) y número de ENP (numero_np).
export const INMUTABLES = new Set<string>(["carta_porte", "correlativo_liquidacion", "numero_np"])

// Etapas cuyos campos se pueden diligenciar SIEMPRE (aunque el proceso ya avanzó):
// el intake (Paso 1) y la ENP (el número NP puede quedar pendiente y llenarse luego).
export const ETAPAS_EDITABLES_SIEMPRE = new Set(["Notificación del embarque", "Documentos faltantes / ENP"])
export function etapaSiempreEditable(nombre: string | null | undefined): boolean {
  return !!nombre && ETAPAS_EDITABLES_SIEMPRE.has(nombre)
}
export function indiceEtapaSiempreEditable(i: number | null): boolean {
  return i != null && i >= 0 && etapaSiempreEditable(PASOS[i]?.nombre)
}

function valorCampo(gestion: unknown, name: string): unknown {
  return (gestion as Record<string, unknown>)[name]
}
function tieneValor(gestion: unknown, name: string): boolean {
  const v = valorCampo(gestion, name)
  return v != null && v !== ""
}

// ¿Se muestra/pide el campo? True si no tiene condición o si su condición se cumple.
export function condicionCumplida(gestion: unknown, c: CampoPaso): boolean {
  if (!c.condicion) return true
  return valorCampo(gestion, c.condicion.campo) === c.condicion.igual
}

// Campos requeridos de una etapa que aún están vacíos. Si la etapa tiene un
// tristate `*_aplica` en `false`, la etapa no aplica y no se exige nada más.
export function faltantesParaAvanzar(gestion: unknown, nombreEtapa: string | null | undefined): CampoPaso[] {
  const paso = pasoPorNombre(nombreEtapa)
  if (!paso) return []

  const aplica = paso.campos.find((c) => c.name.endsWith("_aplica"))
  if (aplica) {
    const v = valorCampo(gestion, aplica.name)
    if (v === false) return [] // la etapa no aplica
    if (v == null || v === "") return [aplica] // falta responder si aplica
    // v === true → se exige el resto (sigue al flujo normal)
  }

  const requeridos = paso.campos.filter(
    (c) => !OPCIONALES_AVANCE.has(c.name) && condicionCumplida(gestion, c),
  )
  return requeridos.filter((c) => !tieneValor(gestion, c.name))
}

// Mapa columna de `gestiones` → índice de etapa (0-based, orden de PASOS),
// tomando la primera etapa que declara el campo.
const CAMPO_ETAPA_IDX: Map<string, number> = (() => {
  const m = new Map<string, number>()
  PASOS.forEach((p, i) => {
    for (const c of p.campos) if (!m.has(c.name)) m.set(c.name, i)
  })
  // El BL se guarda en carta_porte; comparte su etapa.
  const cp = m.get("carta_porte")
  if (cp != null) m.set("numero_bl", cp)
  return m
})()

// Índice de la etapa a la que pertenece un campo, o null si es dato de
// cabecera/intake que no pertenece a ninguna etapa (ej. tipo_operacion, regimen_id).
export function etapaIndexDeCampo(campo: string): number | null {
  return CAMPO_ETAPA_IDX.has(campo) ? (CAMPO_ETAPA_IDX.get(campo) as number) : null
}

// Índice de una etapa por su nombre (para comparar con etapaIndexDeCampo).
export function etapaIndexPorNombre(nombre: string | null | undefined): number {
  if (!nombre) return -1
  return PASOS.findIndex((p) => p.nombre === nombre)
}
