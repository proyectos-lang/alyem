// Catálogo único de dimensiones de la evaluación de satisfacción.
// Usado por el formulario, el radar, el detalle y los promedios.

export interface DimensionSatisfaccion {
  key: "dim_comunicacion" | "dim_tiempos" | "dim_cobros" | "dim_documentacion" | "dim_resolucion" | "dim_atencion" | "dim_valor"
  label: string
  corto: string // etiqueta corta para el radar
}

export const DIMENSIONES: DimensionSatisfaccion[] = [
  { key: "dim_comunicacion", label: "Comunicación y actualizaciones", corto: "Comunicación" },
  { key: "dim_tiempos", label: "Tiempos de la gestión", corto: "Tiempos" },
  { key: "dim_cobros", label: "Claridad de los cobros", corto: "Cobros" },
  { key: "dim_documentacion", label: "Calidad documental", corto: "Documentación" },
  { key: "dim_resolucion", label: "Resolución de problemas", corto: "Resolución" },
  { key: "dim_atencion", label: "Atención y asesoría", corto: "Atención" },
  { key: "dim_valor", label: "Relación valor / precio", corto: "Valor/precio" },
]
