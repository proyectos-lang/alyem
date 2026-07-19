import Link from "next/link"
import { Inbox, CreditCard, FileCheck, Boxes, Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { Buscador } from "@/components/buscador"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { puede, PERMISOS } from "@/lib/permisos"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getSupabase } from "@/lib/supabase/server"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function BandejaAgencia({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la bandeja." />
  const { q } = await searchParams

  const gestiones = await listarGestiones(usuario, { texto: q })
  const solicitudes = gestiones.filter((g) => g.estado?.nombre === "Solicitada")
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  const sb = getSupabase()
  const [{ count: pagosPorVerificar }, { count: docsPorRevisar }] = await Promise.all([
    sb.from("pagos").select("id", { count: "exact", head: true }).eq("estado", "reportado"),
    sb.from("documentos").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
  ])

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Bandeja de operación"
          descripcion="Lo que requiere tu atención hoy."
          acciones={
            puede(usuario, PERMISOS.GESTION_CREAR) ? (
              <Link href="/agencia/gestiones/nueva">
                <Button>
                  <Plus /> Nueva gestión
                </Button>
              </Link>
            ) : undefined
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Solicitudes nuevas" value={solicitudes.length} icon={Inbox} tone={solicitudes.length ? "warning" : "default"} />
          <StatCard label="Gestiones activas" value={activas.length} icon={Boxes} tone="success" />
          <StatCard label="Pagos por verificar" value={pagosPorVerificar ?? 0} icon={CreditCard} tone={pagosPorVerificar ? "warning" : "default"} />
          <StatCard label="Documentos por revisar" value={docsPorRevisar ?? 0} icon={FileCheck} tone={docsPorRevisar ? "warning" : "default"} />
        </div>

        {solicitudes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Solicitudes nuevas por aceptar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {solicitudes.map((g) => (
                <Link
                  key={g.id}
                  href={`/g/${g.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {g.referencia} · <span className="font-normal text-muted-foreground">{g.empresa?.nombre}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{g.descripcion_mercancia ?? "Sin descripción"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:block">ETA {fecha(g.eta)}</span>
                    <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Gestiones activas</h2>
            <Buscador />
          </div>
          <GestionesTabla gestiones={activas} mostrarEmpresa />
        </div>
      </div>
    </PortalShell>
  )
}
