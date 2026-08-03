// Catálogo de columnas del constructor de reportes (client-safe: solo key/label).
// El cálculo de cada valor vive en lib/data/reportes.ts (servidor).

export interface ColumnaReporte {
  key: string
  label: string
}

export const COLUMNAS_REPORTE: ColumnaReporte[] = [
  { key: "referencia", label: "Referencia" },
  { key: "empresa", label: "Cliente" },
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
]

// Columnas por defecto si no se selecciona ninguna.
export const COLUMNAS_DEFAULT = [
  "referencia", "factura", "proveedor", "productos", "naviera", "eta", "pto_ingreso", "estatus",
]

export function labelColumna(key: string): string {
  return COLUMNAS_REPORTE.find((c) => c.key === key)?.label ?? key
}
