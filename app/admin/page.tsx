import Link from "next/link"
import { Boxes, CheckCircle2, Users, DollarSign, Filter } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { Reveal } from "@/components/ui/reveal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardGerencial } from "@/components/dashboard-gerencial"
import { ResumenHoy } from "@/components/resumen-hoy"
import { CorrerTareasBoton } from "@/components/correr-tareas-boton"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { analiticaGerencial } from "@/lib/data/analitica"
import { resumenDelDia, resumenesRecientes } from "@/lib/data/tareas"

export const dynamic = "force-dynamic"

const nfCompact = (n: number) => new Intl.NumberFormat("es-HN", { notation: "compact", maximumFractionDigits: 1 }).format(n)
const fmtFecha = (d: string) => new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${d}T12:00:00Z`))

export default async function AdminResumen({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el resumen." />

  const { desde, hasta } = await searchParams
  const hayRango = !!(desde || hasta)

  const [a, hoy, recientes] = await Promise.all([analiticaGerencial({ desde, hasta }), resumenDelDia(), resumenesRecientes(7)])

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Resumen del negocio"
          descripcion="Dashboards gerenciales de la operación: tendencias, volúmenes y satisfacción."
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              <CorrerTareasBoton />
              <ImprimirBoton />
            </div>
          }
        />

        {/* Filtro por rango de fechas (formulario nativo GET) */}
        <form className="mt-6 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3 print:hidden">
          <span className="flex items-center gap-1.5 pb-2 text-xs font-medium text-muted-foreground">
            <Filter className="size-3.5" /> Rango de fechas
          </span>
          <div className="flex flex-col gap-1">
            <Label htmlFor="desde" className="text-xs">Desde</Label>
            <Input id="desde" type="date" name="desde" defaultValue={desde ?? ""} className="h-9 w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="hasta" className="text-xs">Hasta</Label>
            <Input id="hasta" type="date" name="hasta" defaultValue={hasta ?? ""} className="h-9 w-40" />
          </div>
          <Button type="submit" size="sm" variant="outline">Filtrar</Button>
          {hayRango && (
            <Link href="/admin"><Button type="button" size="sm" variant="ghost">Limpiar</Button></Link>
          )}
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {hayRango
            ? `Mostrando operaciones ${desde ? `desde ${fmtFecha(desde)}` : ""}${desde && hasta ? " " : ""}${hasta ? `hasta ${fmtFecha(hasta)}` : ""}.`
            : "Mostrando todas las operaciones (sin filtro de fechas). El gráfico diario muestra los últimos 30 días."}
        </p>

        <div className="mt-6">
          <Reveal><ResumenHoy hoy={hoy} recientes={recientes} /></Reveal>
        </div>

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
