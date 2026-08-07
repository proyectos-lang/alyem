// Configuración de los campos que se capturan en cada paso del proceso.
// La clave es el nombre de la etapa (estados_catalogo.nombre).

export type TipoCampo = "text" | "textarea" | "num" | "date" | "datetime" | "tristate" | "select" | "aduana"

export interface CampoPaso {
  name: string
  label: string
  tipo: TipoCampo
  opciones?: { value: string; label: string }[]
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
      { name: "numero_factura", label: "Número de factura", tipo: "text" },
      { name: "contenedores", label: "Contenedor(es)", tipo: "text" },
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
      { name: "origen_carga", label: "Origen de la carga", tipo: "text" },
      { name: "marca", label: "Marca", tipo: "text" },
      { name: "modelo", label: "Modelo(s) — uno por línea", tipo: "textarea" },
      { name: "forma_pago", label: "Forma de pago", tipo: "select", opciones: FORMA_PAGO },
      { name: "forma_pago_otro", label: "Forma de pago (otros)", tipo: "text" },
      { name: "razon_social", label: "Razón social (DUCA T)", tipo: "text" },
      { name: "rtn", label: "RTN (DUCA T)", tipo: "text" },
      { name: "kilos", label: "Kilos (DUCA T)", tipo: "num" },
      { name: "bultos", label: "Bultos (DUCA T)", tipo: "num" },
      { name: "numeros_factura", label: "Números de factura (DUCA T)", tipo: "text" },
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
    nombre: "Levante de aduana",
    responsable: "alyem",
    descripcion: "Se registra la fecha y hora de despacho.",
    campos: [{ name: "fecha_hora_despacho", label: "Fecha y hora de despacho", tipo: "datetime" }],
  },
  {
    nombre: "Entrega del gatepass",
    responsable: "alyem",
    descripcion: "Aplica solo para Puerto Cortés.",
    campos: [
      { name: "gatepass_aplica", label: "¿Aplica?", tipo: "tristate" },
      { name: "transporte_naviera", label: "Transporte de la naviera", tipo: "tristate" },
      { name: "gatepass_entregado", label: "Gatepass entregado", tipo: "tristate" },
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
