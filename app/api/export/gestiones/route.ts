import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"

export const dynamic = "force-dynamic"

function csvCampo(v: unknown): string {
  const s = v == null ? "" : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

// Exporta las gestiones visibles a CSV (abre en Excel).
export async function GET(req: Request) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return new Response("No autorizado", { status: 401 })

  const q = new URL(req.url).searchParams.get("q") ?? undefined
  const gestiones = await listarGestiones(usuario, { texto: q })

  const encabezados = [
    "Referencia", "Empresa", "Tipo", "Estado", "Aduana", "Naviera",
    "Contenedores", "N.º factura", "ETA", "Canal selectivo", "Descripción",
  ]
  const filas = gestiones.map((g) =>
    [
      g.referencia, g.empresa?.nombre, g.tipo_operacion, g.estado?.nombre, g.aduana?.nombre, g.naviera,
      g.contenedores, g.numero_factura, g.eta, g.canal_selectivo, g.descripcion_carga,
    ].map(csvCampo).join(","),
  )
  // BOM para que Excel reconozca UTF-8.
  const csv = "﻿" + [encabezados.map(csvCampo).join(","), ...filas].join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gestiones-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
