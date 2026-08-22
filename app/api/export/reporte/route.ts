import * as XLSX from "xlsx"
import { usuarioActivoSeguro } from "@/lib/portal"
import { filasReporte, valorColumna } from "@/lib/data/reportes"
import { labelColumna } from "@/lib/reportes"
import { getSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Exporta el reporte configurado a un archivo Excel (.xlsx) con cada columna
// en su propia celda (una hoja "Reporte").
export async function GET(req: Request) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return new Response("No autorizado", { status: 401 })

  const sp = new URL(req.url).searchParams
  const cols = (sp.get("cols") ?? "").split(",").filter(Boolean)
  if (cols.length === 0) return new Response("Selecciona columnas", { status: 400 })

  const filas = await filasReporte(usuario, {
    empresaId: sp.get("empresa") ?? undefined,
    desde: sp.get("desde") ?? undefined,
    hasta: sp.get("hasta") ?? undefined,
    base: (sp.get("base") as "eta" | "solicitud") ?? "eta",
    regimen: sp.get("regimen") ?? undefined,
    tipo: sp.get("tipo") ?? undefined,
    documento: sp.get("documento") ?? undefined,
    producto: sp.get("producto") ?? undefined,
  })

  // Matriz encabezado + filas (cada celda es una columna separada).
  const encabezados = cols.map((c) => labelColumna(c))
  const aoa: unknown[][] = [encabezados, ...filas.map((g) => cols.map((c) => valorColumna(g, c) ?? ""))]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  // Ancho de columnas según el contenido (encabezado y celdas).
  ws["!cols"] = cols.map((c, i) => {
    const largoMax = Math.max(
      encabezados[i]?.length ?? 10,
      ...filas.map((g) => String(valorColumna(g, c) ?? "").length),
    )
    return { wch: Math.min(Math.max(largoMax + 2, 10), 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Reporte")
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer

  // Si se generó desde una definición guardada, registra la instantánea.
  const def = sp.get("def")
  if (def) {
    try {
      await getSupabase().from("reportes_instantaneas").insert({ definicion_id: def, generado_por: usuario.id, filas: filas.length })
    } catch {
      /* la tabla puede no existir aún si no se ha corrido 06-mejoras.sql */
    }
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
