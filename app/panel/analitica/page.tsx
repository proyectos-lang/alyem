import { Boxes, CheckCircle2, DollarSign, Timer, Layers } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { Reveal } from "@/components/ui/reveal"
import { DashboardCliente } from "@/components/dashboard-cliente"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { analiticaCliente } from "@/lib/data/analitica-cliente"

export const dynamic = "force-dynamic"

const nf = (n: number) => new Intl.NumberFormat("es-HN", { notation: "compact", maximumFractionDigits: 1 }).format(n)

export default async function AnaliticaClientePage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver tus indicadores." />

  if (!usuario.empresa_id) {
    return (
      <PortalShell roles={["cliente"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Tu usuario no está asociado a una empresa.
        </div>
      </PortalShell>
    )
  }

  const a = await analiticaCliente(usuario.empresa_id)

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Indicadores"
          descripcion="Análisis de tus operaciones: volúmenes, costos FOB y distribución."
          acciones={<ImprimirBoton />}
        />

        <Reveal className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard label="Operaciones" value={a.totales.total} icon={Boxes} spark={a.serieMensual.map((m) => m.operaciones)} />
          <StatCard label="Activas" value={a.totales.activas} icon={Boxes} tone="warning" proporcion={{ valor: a.totales.activas, total: a.totales.total }} />
          <StatCard label="Cerradas" value={a.totales.cerradas} icon={CheckCircle2} tone="success" proporcion={{ valor: a.totales.cerradas, total: a.totales.total }} />
          <StatCard label="FOB total (aprox.)" value={nf(a.totales.fobTotal)} icon={DollarSign} spark={a.serieMensual.map((m) => m.fob)} />
          <StatCard label="CIF total (aprox.)" value={nf(a.totales.cifTotal)} icon={Layers} />
          <StatCard label="Días prom. a cierre" value={a.totales.diasPromedioCierre ?? "—"} icon={Timer} />
        </Reveal>

        {a.totales.total === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Aún no tienes operaciones para analizar.
          </p>
        ) : (
          <div className="mt-6">
            <DashboardCliente data={a} />
          </div>
        )}
      </div>
    </PortalShell>
  )
}
