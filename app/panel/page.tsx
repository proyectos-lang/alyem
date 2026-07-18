import Link from "next/link"
import { Boxes, FileWarning, CreditCard, Bell, Plus } from "lucide-react"
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
import { moneda } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function PanelCliente({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el panel." />
  const { q } = await searchParams

  const gestiones = await listarGestiones(usuario, { texto: q })
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  const sb = getSupabase()
  const ids = gestiones.map((g) => g.id)

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

  // Monto pendiente de pago (liquidaciones emitidas con saldo).
  let pagosPendientes = 0
  if (ids.length) {
    const { data: liqs } = await sb.from("liquidaciones").select("id").in("gestion_id", ids).eq("estado", "emitida")
    const liqIds = (liqs as { id: string }[])?.map((l) => l.id) ?? []
    if (liqIds.length) {
      const { data: saldos } = await sb.from("v_saldos_liquidacion").select("*").in("liquidacion_id", liqIds)
      for (const s of (saldos as any[]) ?? []) pagosPendientes += Number(s.total) - Number(s.pagado_verificado)
    }
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
                <Plus /> Nueva gestión
              </Button>
            </Link>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Gestiones activas" value={activas.length} icon={Boxes} />
          <StatCard
            label="Documentos pendientes"
            value={docsPendientes}
            icon={FileWarning}
            tone={docsPendientes ? "warning" : "default"}
          />
          <StatCard
            label="Pagos pendientes"
            value={moneda(pagosPendientes)}
            icon={CreditCard}
            tone={pagosPendientes > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Novedades sin leer"
            value={novedades ?? 0}
            icon={Bell}
            tone={novedades ? "danger" : "default"}
          />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Mis gestiones</h2>
            <Buscador />
          </div>
          <GestionesTabla gestiones={gestiones} />
        </div>
      </div>
    </PortalShell>
  )
}
