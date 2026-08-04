import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { SetupNotice } from "@/components/setup-notice"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { BalancedScorecard } from "@/components/balanced-scorecard"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { resumenBSC, tiemposEntreProcesos } from "@/lib/data/metricas"

export const dynamic = "force-dynamic"

export default async function Indicadores() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los indicadores." />

  const [gestiones, slaStr, tiempos] = await Promise.all([
    listarGestiones(usuario),
    getConfig("sla_dias_proceso"),
    tiemposEntreProcesos(),
  ])
  const sla = Number(slaStr ?? "15")
  const r = await resumenBSC(gestiones, sla)

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
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Balanced Scorecard"
          descripcion="Cada indicador marco agrupa sus micro-indicadores. Despliega una fila para ver el detalle."
          acciones={<ImprimirBoton />}
        />
        <div className="mt-6">
          <BalancedScorecard data={data} />
        </div>
      </div>
    </PortalShell>
  )
}
