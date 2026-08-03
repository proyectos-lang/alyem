import Link from "next/link"
import { Boxes, FileWarning, CheckCircle2, Bell, Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function PanelCliente({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el panel." />
  const { q } = await searchParams

  const gestiones = await listarGestiones(usuario, { texto: q })
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const cerradas = gestiones.filter((g) => g.estado?.tipo === "final")

  const sb = getSupabase()

  // Documentos pendientes de subir.
  let docsPendientes = 0
  if (usuario.empresa_id) {
    const { count } = await sb
      .from("documentos_requeridos")
      .select("id, gestion:gestiones!inner(empresa_id)", { count: "exact", head: true })
      .eq("cumplido", false)
      .eq("gestion.empresa_id", usuario.empresa_id)
    docsPendientes = count ?? 0
  }

  const { count: novedades } = await sb
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuario.id)
    .eq("leida", false)

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
          descripcion={usuario.empresa?.nombre ?? "Tus gestiones aduaneras"}
          acciones={
            <Link href="/panel/gestiones/nueva">
              <Button>
                <Plus /> Nueva operación
              </Button>
            </Link>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Operaciones activas" value={activas.length} icon={Boxes} />
          <StatCard
            label="Documentos pendientes"
            value={docsPendientes}
            icon={FileWarning}
            tone={docsPendientes ? "warning" : "default"}
          />
          <StatCard label="Operaciones cerradas" value={cerradas.length} icon={CheckCircle2} tone="success" />
          <StatCard
            label="Novedades sin leer"
            value={novedades ?? 0}
            icon={Bell}
            tone={novedades ? "danger" : "default"}
          />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Mis operaciones</h2>
            <Buscador />
          </div>
          <GestionesTabla gestiones={gestiones} />
        </div>
      </div>
    </PortalShell>
  )
}
