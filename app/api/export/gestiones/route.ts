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
    "Referencia", "Empresa", "Ref. cliente", "Tipo", "Modo", "Estado",
    "BL", "Contenedores", "Origen", "Destino", "ETA", "Mercancía",
  ]
  const filas = gestiones.map((g) =>
    [
      g.referencia, g.empresa?.nombre, g.referencia_cliente, g.tipo_operacion, g.modo,
      g.estado?.nombre, g.bl, g.contenedores, g.puerto_origen, g.puerto_destino, g.eta, g.descripcion_mercancia,
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
