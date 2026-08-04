import { Boxes, CheckCircle2, Users, DollarSign } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { Reveal } from "@/components/ui/reveal"
import { DashboardGerencial } from "@/components/dashboard-gerencial"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { analiticaGerencial } from "@/lib/data/analitica"

export const dynamic = "force-dynamic"

const nfCompact = (n: number) => new Intl.NumberFormat("es-HN", { notation: "compact", maximumFractionDigits: 1 }).format(n)

export default async function AdminResumen() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el resumen." />

  const a = await analiticaGerencial()

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Resumen del negocio"
          descripcion="Dashboards gerenciales de la operación: tendencias, volúmenes y satisfacción."
          acciones={<ImprimirBoton />}
        />

        {/* KPIs destacados */}
        <Reveal className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Operaciones totales" value={a.totales.total} icon={Boxes} spark={a.serieMensual.map((m) => m.creadas)} />
          <StatCard label="Activas" value={a.totales.activas} icon={Boxes} tone="warning" proporcion={{ valor: a.totales.activas, total: a.totales.total }} />
          <StatCard label="Cerradas" value={a.totales.cerradas} icon={CheckCircle2} tone="success" spark={a.serieMensual.map((m) => m.cerradas)} />
          <StatCard label="Valor CIF (aprox.)" value={nfCompact(a.totales.cifTotal)} icon={DollarSign} spark={a.serieMensual.map((m) => m.cif)} />
          <StatCard label="Clientes activos" value={a.totales.clientes} icon={Users} />
        </Reveal>

        <div className="mt-6">
          <DashboardGerencial data={a} />
        </div>
      </div>
    </PortalShell>
  )
}
