import { Gauge, Workflow, Users, FileCheck2, ShieldQuestion } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { resumenBSC, tiemposEntreProcesos } from "@/lib/data/metricas"

export const dynamic = "force-dynamic"

function Tile({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const color = { default: "text-foreground", success: "text-emerald-600", warning: "text-amber-600", danger: "text-destructive" }[tone]
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Perspectiva({ titulo, icon: Icon, children }: { titulo: string; icon: typeof Gauge; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">{children}</CardContent>
    </Card>
  )
}

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
  const maxT = Math.max(1, ...tiempos.map((t) => t.dias))

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Balanced Scorecard"
          descripcion="Indicadores clave de la operación, tiempos, cliente y calidad documental."
        />

        {/* Indicador principal: tiempo entre procesos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Gauge className="size-4" /></span>
              Tiempo promedio entre procesos (días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tiempos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay suficientes eventos para calcular tiempos.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tiempos.map((t) => (
                  <div key={t.etapa} className="flex items-center gap-3">
                    <span className="w-52 shrink-0 truncate text-sm">{t.etapa}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(t.dias / maxT) * 100}%`, backgroundColor: t.color }} />
                    </div>
                    <span className="w-16 text-right text-sm font-semibold">{t.dias} d</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Mide cuánto tarda cada etapa antes de avanzar a la siguiente. Útil para detectar cuellos de botella.
            </p>
          </CardContent>
        </Card>

        {/* Cuatro perspectivas del scorecard */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Perspectiva titulo="Procesos operativos" icon={Workflow}>
            <Tile label="Operaciones totales" value={r.total} />
            <Tile label="Activas" value={r.activas} tone="warning" />
            <Tile label="Cerradas" value={r.cerradas} tone="success" />
            <Tile label="Canceladas" value={r.canceladas} tone={r.canceladas ? "danger" : "default"} />
          </Perspectiva>

          <Perspectiva titulo="Eficiencia y tiempos" icon={Gauge}>
            <Tile label="Días promedio a cierre" value={r.diasPromedioCierre ?? "—"} hint={`SLA objetivo: ${r.slaObjetivo} d`} />
            <Tile label="Cumplimiento de SLA" value={pctSla != null ? `${pctSla}%` : "—"} hint={`${r.cumplenSla}/${r.totalConCierre} cerradas`} tone={pctSla != null && pctSla >= 80 ? "success" : pctSla != null ? "warning" : "default"} />
          </Perspectiva>

          <Perspectiva titulo="Cliente" icon={Users}>
            <Tile label="Satisfacción promedio" value={r.satisfaccionPromedio != null ? `${r.satisfaccionPromedio} ★` : "—"} />
            <Tile label="Calificaciones" value={r.calificaciones} />
            <Tile label="Calificaciones bajas (≤3)" value={r.calificacionesBajas} tone={r.calificacionesBajas ? "danger" : "success"} />
          </Perspectiva>

          <Perspectiva titulo="Calidad documental" icon={FileCheck2}>
            <Tile label="Documentos" value={r.docsTotal} />
            <Tile label="% aceptados" value={pctDocs != null ? `${pctDocs}%` : "—"} tone={pctDocs != null && pctDocs >= 80 ? "success" : "default"} />
            <Tile label="Por revisar" value={r.docsPendientes} tone={r.docsPendientes ? "warning" : "default"} />
          </Perspectiva>
        </div>

        {/* Selectividad */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldQuestion className="size-4" /></span>
              Selectividad (canales)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <Tile label="Verde" value={r.canal.verde} tone="success" />
            <Tile label="Amarillo" value={r.canal.amarillo} tone="warning" />
            <Tile label="Rojo" value={r.canal.rojo} tone={r.canal.rojo ? "danger" : "default"} />
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
