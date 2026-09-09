// Estado del permiso de UTOH según su fecha de vencimiento. Umbral de aviso: 30 días.
export const UTOH_UMBRAL_DIAS = 30

export type EstadoUtoh = "vigente" | "por_vencer" | "vencido" | null

export function diasParaUtoh(vencimiento: string | null | undefined): number | null {
  if (!vencimiento) return null
  const d = new Date(`${String(vencimiento).slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

export function estadoUtoh(vencimiento: string | null | undefined): { estado: EstadoUtoh; dias: number | null } {
  const dias = diasParaUtoh(vencimiento)
  if (dias == null) return { estado: null, dias: null }
  if (dias < 0) return { estado: "vencido", dias }
  if (dias <= UTOH_UMBRAL_DIAS) return { estado: "por_vencer", dias }
  return { estado: "vigente", dias }
}
