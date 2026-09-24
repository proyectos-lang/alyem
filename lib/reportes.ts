// Catálogo de columnas del constructor de reportes (client-safe: solo key/label).
// El cálculo de cada valor vive en lib/data/reportes.ts (servidor).

export interface ColumnaReporte {
  key: string
  label: string
}

export const COLUMNAS_REPORTE: ColumnaReporte[] = [
  { key: "referencia", label: "Referencia" },
  { key: "empresa", label: "Cliente" },
  { key: "tipo_operacion", label: "Tipo de operación" },
  { key: "regimen", label: "Régimen aduanero" },
  { key: "doc_transporte", label: "Documento de transporte" },
  { key: "factura", label: "Factura" },
  { key: "proveedor", label: "Proveedor" },
  { key: "productos", label: "Producto(s)" },
  { key: "naviera", label: "Naviera" },
  { key: "eta", label: "ETA" },
  { key: "fin_dias_libres", label: "Fin días libres" },
  { key: "pto_ingreso", label: "Pto de ingreso" },
  { key: "observaciones", label: "Observaciones PM" },
  { key: "estatus", label: "Estatus" },
  { key: "despachado", label: "Despachado (frontera / levante)" },
  { key: "selectividad", label: "Selectividad" },
  { key: "correlativo", label: "Correlativo" },
  { key: "contenedor", label: "Contenedor" },
  { key: "manifiesto", label: "Manifiesto" },
  { key: "prefijo", label: "Prefijo (código de aduana)" },
  // Campos de flujos por tipo (exportaciones, DUCA F, FYDUCA).
  { key: "etd", label: "ETD" },
  { key: "aduana_salida", label: "Aduana de salida" },
  { key: "fecha_vencimiento", label: "Fecha de vencimiento" },
  { key: "numero_fyduca", label: "Número de FYDUCA" },
  { key: "numero_mandamiento", label: "Número de mandamiento" },
  { key: "permiso_sepa", label: "Permiso SEPA" },
  { key: "permiso_arsa", label: "Permiso ARSA" },
  { key: "permiso_banco_central", label: "Declaración Banco Central" },
  { key: "frontera", label: "Despacho de frontera" },
  // Datos del tracking del contenedor (última consulta a la naviera).
  { key: "tk_ubicacion", label: "Tracking: última ubicación" },
  { key: "tk_puerto_carga", label: "Tracking: puerto de carga" },
  { key: "tk_puerto_descarga", label: "Tracking: puerto de descarga" },
  { key: "tk_eta_destino", label: "Tracking: ETA destino final" },
  { key: "tk_atd", label: "Tracking: salida del origen (ATD)" },
  { key: "tk_vessel", label: "Tracking: buque" },
  { key: "tk_ultimo_mov", label: "Tracking: último movimiento" },
  { key: "tk_fecha_consulta", label: "Tracking: fecha de última consulta" },
]

// Columnas por defecto si no se selecciona ninguna.
export const COLUMNAS_DEFAULT = [
  "referencia", "factura", "proveedor", "productos", "naviera", "eta", "pto_ingreso", "estatus",
]

export function labelColumna(key: string): string {
  return COLUMNAS_REPORTE.find((c) => c.key === key)?.label ?? key
}
