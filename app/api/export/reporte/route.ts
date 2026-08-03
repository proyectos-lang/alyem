import { usuarioActivoSeguro } from "@/lib/portal"
import { filasReporte, valorColumna } from "@/lib/data/reportes"
import { labelColumna } from "@/lib/reportes"

export const dynamic = "force-dynamic"

function csv(v: unknown): string {
  const s = v == null ? "" : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

// Exporta el reporte configurado a CSV (abre en Excel).
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
  })

  const encabezado = cols.map((c) => csv(labelColumna(c))).join(",")
  const cuerpo = filas.map((g) => cols.map((c) => csv(valorColumna(g, c))).join(",")).join("\r\n")
  const contenido = "﻿" + [encabezado, cuerpo].filter(Boolean).join("\r\n")

  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
