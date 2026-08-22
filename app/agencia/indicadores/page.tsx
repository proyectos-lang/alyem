import Link from "next/link"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { SetupNotice } from "@/components/setup-notice"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { BalancedScorecard } from "@/components/balanced-scorecard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { resumenBSC, tiemposEntreProcesos } from "@/lib/data/metricas"

export const dynamic = "force-dynamic"

const TZ = "America/Tegucigalpa"
const mesActualTZ = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date())
const etiquetaMes = (mes: string) =>
  new Intl.DateTimeFormat("es-HN", { timeZone: TZ, month: "long", year: "numeric" }).format(new Date(`${mes}-01T12:00:00Z`))

export default async function Indicadores({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los indicadores." />

  // Por defecto se muestra el mes actual filtrado; "todos" quita el filtro.
  const { mes: mesParam } = await searchParams
  const mes = mesParam ?? mesActualTZ()
  const filtrarMes = mes !== "todos" && /^\d{4}-\d{2}$/.test(mes)

  const [todas, slaStr] = await Promise.all([listarGestiones(usuario), getConfig("sla_dias_proceso")])
  const gestiones = filtrarMes ? todas.filter((g) => String(g.fecha_solicitud).slice(0, 7) === mes) : todas
  const sla = Number(slaStr ?? "15")
  const [r, tiempos] = await Promise.all([
    resumenBSC(gestiones, sla),
    tiemposEntreProcesos(filtrarMes ? gestiones.map((g) => g.id) : undefined),
  ])

  const pctSla = r.totalConCierre ? Math.round((r.cumplenSla / r.totalConCierre) * 100) : null
  const pctDocs = r.docsTotal ? Math.round((r.docsAceptados / r.docsTotal) * 100) : null

  const data = {
    procesos: { total: r.total, activas: r.activas, cerradas: r.cerradas, canceladas: r.canceladas },
    eficiencia: { diasPromedioCierre: r.diasPromedioCierre, slaObjetivo: r.slaObjetivo, pctSla, cumplenSla: r.cumplenSla, totalConCierre: r.totalConCierre },
    cliente: { satisfaccionPromedio: r.satisfaccionPromedio, calificaciones: r.calificaciones, calificacionesBajas: r.calificacionesBajas },
    docs: { docsTotal: r.docsTotal, pctDocs, docsPendientes: r.docsPendientes, docsAceptados: r.docsAceptados },
    selectividad: { verde: r.canal.verde, amarillo: r.canal.amarillo, rojo: r.canal.rojo },
    tiempos: tiempos.map((t) => ({ etapa: t.etapa, dias: t.dias, color: t.color })),
  }

  return (
    <PortalShell roles={["operador", "admin", "cliente_aduanero"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Balanced Scorecard"
          descripcion="Cada indicador marco agrupa sus micro-indicadores. Despliega una fila para ver el detalle."
          acciones={
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <form className="flex items-center gap-1.5">
                <Input type="month" name="mes" defaultValue={filtrarMes ? mes : ""} className="h-9 w-40" />
                <Button type="submit" size="sm" variant="outline">Filtrar</Button>
              </form>
              <Link href="/agencia/indicadores?mes=todos">
                <Button size="sm" variant={filtrarMes ? "ghost" : "secondary"}>Todos</Button>
              </Link>
              <ImprimirBoton />
            </div>
          }
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {filtrarMes
            ? `Operaciones solicitadas en ${etiquetaMes(mes)}.`
            : "Todas las operaciones (sin filtro de mes)."}
        </p>
        <div className="mt-6">
          <BalancedScorecard data={data} />
        </div>
      </div>
    </PortalShell>
  )
}
