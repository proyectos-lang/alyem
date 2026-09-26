import Link from "next/link"
import { ArrowLeft, Package, PackageMinus, Wallet, Building2, CalendarClock } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/stat-card"
import { PanelParciales } from "@/components/descargas/panel-parciales"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getCabecera } from "@/lib/data/descargas"
import { puede, PERMISOS } from "@/lib/permisos"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

const num = (n: number) => n.toLocaleString("es-HN", { maximumFractionDigits: 3 })
const ESTADO: Record<string, { label: string; variant: "success" | "muted" | "danger" }> = {
  abierta: { label: "Abierta", variant: "success" },
  cerrada: { label: "Cerrada", variant: "muted" },
  cancelada: { label: "Cancelada", variant: "danger" },
}

export default async function DescargaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la descarga." />
  const { id } = await params

  const data = await getCabecera(id, usuario)
  if (!data) {
    return (
      <PortalShell roles={["operador", "admin"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Descarga no encontrada o no tienes acceso a ella.
        </div>
      </PortalShell>
    )
  }
  const { cabecera: c, parciales } = data
  const total = Number(c.cantidad_total)
  const retirado = c.retirado ?? 0
  const saldo = c.saldo ?? total - retirado
  const est = ESTADO[c.estado] ?? { label: c.estado, variant: "muted" as const }
  const puedeEditar = puede(usuario, PERMISOS.DESCARGA_CREAR)

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <Link href="/agencia/descargas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </Link>

        {/* Encabezado */}
        <Card className="overflow-hidden border-border bg-gradient-to-br from-accent/40 to-card">
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <PackageMinus className="size-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">{c.referencia}</h1>
              <Badge variant={est.variant}>{est.label}</Badge>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" /> {c.empresa?.nombre ?? "—"}</span>
              {c.bl && <span>BL {c.bl}</span>}
              {c.producto && <span>{c.producto}</span>}
              {c.aduana && <span>{c.aduana.nombre}</span>}
              {c.fecha_vencimiento && (
                <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" /> Vence {fecha(c.fecha_vencimiento)}</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Saldo */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={`Cantidad total (${c.unidad})`} value={num(total)} icon={Package} />
          <StatCard label={`Retirado (${c.unidad})`} value={num(retirado)} icon={PackageMinus} tone="warning" />
          <StatCard label={`Saldo disponible (${c.unidad})`} value={num(saldo)} icon={Wallet} tone={saldo <= 0 ? "danger" : "success"} />
        </div>

        {/* Descargos parciales */}
        <div className="mt-6">
          <PanelParciales
            cabeceraId={c.id}
            parciales={parciales}
            unidad={c.unidad}
            saldo={saldo}
            puedeEditar={puedeEditar && c.estado === "abierta"}
          />
        </div>
      </div>
    </PortalShell>
  )
}
