"use server"

import { revalidatePath } from "next/cache"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { ejecutarEscalamientoSla, generarResumenDiario } from "../data/tareas"

// Disparo manual de las tareas diarias (solo admin). Útil para probar sin
// esperar al cron.
export async function correrTareasDiarias(): Promise<{ escalados: number }> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.ADMIN_CONFIG)
  const [sla] = await Promise.all([ejecutarEscalamientoSla(), generarResumenDiario()])
  revalidatePath("/admin")
  return { escalados: sla.escalados }
}
