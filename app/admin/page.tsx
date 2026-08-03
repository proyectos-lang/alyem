import { Boxes, FileCheck, Star, TriangleAlert } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { getSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminResumen() {
  const sb = getSupabase()
  const [gestTotal, gestActivas, docsPend, califs, empresas] = await Promise.all([
    sb.from("gestiones").select("id", { count: "exact", head: true }),
    sb
      .from("v_gestion_estado_actual")
      .select("gestion_id, estado_tipo", { count: "exact", head: true })
      .neq("estado_tipo", "final"),
    sb.from("documentos").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    sb.from("calificaciones").select("estrellas"),
    sb.from("empresas").select("id", { count: "exact", head: true }),
  ])

  const estrellas = (califs.data as { estrellas: number }[]) ?? []
  const promedio = estrellas.length
    ? (estrellas.reduce((a, b) => a + b.estrellas, 0) / estrellas.length).toFixed(1)
    : "—"
  const bajas = estrellas.filter((c) => c.estrellas <= 3).length

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader titulo="Resumen del negocio" descripcion="Visión global de la operación de la agencia." />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Operaciones totales" value={gestTotal.count ?? 0} icon={Boxes} />
          <StatCard label="Operaciones activas" value={gestActivas.count ?? 0} icon={Boxes} tone="success" />
          <StatCard
            label="Documentos por revisar"
            value={docsPend.count ?? 0}
            icon={FileCheck}
            tone={docsPend.count ? "warning" : "default"}
          />
          <StatCard
            label="Satisfacción promedio"
            value={`${promedio} ★`}
            hint={`${bajas} calificación(es) ≤ 3`}
            icon={Star}
            tone={bajas ? "danger" : "default"}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Empresas cliente" value={empresas.count ?? 0} icon={Boxes} />
          <StatCard
            label="Calificaciones bajas por atender"
            value={bajas}
            icon={TriangleAlert}
            tone={bajas ? "danger" : "default"}
          />
        </div>
      </div>
    </PortalShell>
  )
}
