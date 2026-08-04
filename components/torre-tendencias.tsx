import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Gauge } from "lucide-react"
import type { Tendencias } from "@/lib/data/metricas"

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
function etiquetaMes(key: string) {
  const [, m] = key.split("-")
  return MES_CORTO[Number(m) - 1] ?? key
}

export function TorreTendencias({ data }: { data: Tendencias }) {
  const maxMes = Math.max(1, ...data.meses.map((m) => Math.max(m.creadas, m.cerradas)))
  const maxDias = Math.max(1, ...data.etapas.map((e) => Math.max(e.dias, e.sla ?? 0)))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Throughput por mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4" /> Operaciones por mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 pt-2">
            {data.meses.map((m) => (
              <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 items-end gap-1">
                  <div className="w-3 rounded-t bg-primary" style={{ height: `${(m.creadas / maxMes) * 100}%` }} title={`${m.creadas} creadas`} />
                  <div className="w-3 rounded-t bg-[#57585a]" style={{ height: `${(m.cerradas / maxMes) * 100}%` }} title={`${m.cerradas} cerradas`} />
                </div>
                <span className="text-[11px] text-muted-foreground">{etiquetaMes(m.mes)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary" /> Creadas</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#57585a]" /> Cerradas</span>
          </div>
        </CardContent>
      </Card>

      {/* Tiempos por etapa vs SLA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gauge className="size-4" /> Tiempo real por etapa vs SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.etapas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay suficientes datos.</p>
          ) : (
            data.etapas.map((e) => {
              const excede = e.sla != null && e.dias > e.sla
              return (
                <div key={e.etapa} className="flex items-center gap-2">
                  <span className="w-40 shrink-0 truncate text-xs">{e.etapa}</span>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(e.dias / maxDias) * 100}%`, backgroundColor: excede ? "#ef4444" : e.color }} />
                    {e.sla != null && (
                      <span className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${(e.sla / maxDias) * 100}%` }} title={`SLA ${e.sla}d`} />
                    )}
                  </div>
                  <span className={`w-16 text-right text-xs font-semibold ${excede ? "text-destructive" : ""}`}>
                    {e.dias}d{e.sla != null ? ` / ${e.sla}` : ""}
                  </span>
                </div>
              )
            })
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">La línea marca el SLA objetivo de la etapa; en rojo si el tiempo real lo excede.</p>
        </CardContent>
      </Card>
    </div>
  )
}
