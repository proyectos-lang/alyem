import * as XLSX from "xlsx"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

const TIPO_LABEL: Record<string, string> = {
  importacion: "Importación",
  exportacion: "Exportación",
  transito: "Tránsito",
}

// Exporta las operaciones visibles a un archivo Excel (.xlsx) con cada columna
// en su propia celda (una hoja "Operaciones").
export async function GET(req: Request) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return new Response("No autorizado", { status: 401 })

  const q = new URL(req.url).searchParams.get("q") ?? undefined
  const gestiones = await listarGestiones(usuario, { texto: q })

  const encabezados = [
    "Referencia", "Empresa", "Tipo", "Estado", "Aduana", "Naviera",
    "Contenedores", "N.º factura", "ETA", "Canal selectivo", "Descripción",
  ]
  const filas = gestiones.map((g) => [
    g.referencia,
    g.empresa?.nombre ?? "",
    TIPO_LABEL[g.tipo_operacion] ?? g.tipo_operacion,
    g.estado?.nombre ?? "",
    g.aduana?.nombre ?? "",
    g.naviera ?? "",
    g.contenedores ?? "",
    g.numero_factura ?? "",
    g.eta ? fecha(g.eta) : "",
    g.canal_selectivo ?? "",
    g.descripcion_carga ?? "",
  ])

  const aoa: unknown[][] = [encabezados, ...filas]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws["!cols"] = encabezados.map((h, i) => {
    const largoMax = Math.max(h.length, ...filas.map((f) => String(f[i] ?? "").length))
    return { wch: Math.min(Math.max(largoMax + 2, 10), 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Operaciones")
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="operaciones-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
