import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ResumenDia } from "@/lib/data/tareas"

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
function etiqueta(fechaISO: string) {
  const [, m, d] = fechaISO.split("-")
  return `${Number(d)} ${MES[Number(m) - 1] ?? ""}`
}

export function ResumenHoy({ hoy, recientes }: { hoy: ResumenDia; recientes: ResumenDia[] }) {
  const metricas = [
    { l: "Creadas hoy", v: hoy.creadasHoy },
    { l: "Cerradas hoy", v: hoy.cerradasHoy },
    { l: "Activas", v: hoy.activas },
    { l: "Con alertas", v: hoy.conAlertas, tono: hoy.conAlertas ? "warning" : "" },
    { l: "Exceden SLA", v: hoy.slaExcedidos, tono: hoy.slaExcedidos ? "danger" : "" },
    { l: "En riesgo", v: hoy.enRiesgo, tono: hoy.enRiesgo ? "warning" : "" },
    { l: "Canal rojo", v: hoy.canalRojo, tono: hoy.canalRojo ? "danger" : "" },
    { l: "Docs pendientes", v: hoy.docsPendientes, tono: hoy.docsPendientes ? "warning" : "" },
  ]
  const tono = (t?: string) => (t === "danger" ? "text-destructive" : t === "warning" ? "text-amber-600" : "text-foreground")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4" /> Resumen de hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {metricas.map((m) => (
            <div key={m.l} className="rounded-lg border border-border p-2.5">
              <p className="text-[11px] text-muted-foreground">{m.l}</p>
              <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", tono(m.tono))}>{m.v}</p>
            </div>
          ))}
        </div>

        {recientes.length > 1 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Día</th>
                  <th className="py-1.5 pr-3 font-medium">Creadas</th>
                  <th className="py-1.5 pr-3 font-medium">Cerradas</th>
                  <th className="py-1.5 pr-3 font-medium">Alertas</th>
                  <th className="py-1.5 pr-3 font-medium">Exceden SLA</th>
                  <th className="py-1.5 font-medium">En riesgo</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((r) => (
                  <tr key={r.fecha} className="border-t border-border/60 text-muted-foreground">
                    <td className="py-1.5 pr-3 font-medium text-foreground">{etiqueta(r.fecha)}</td>
                    <td className="py-1.5 pr-3">{r.creadasHoy}</td>
                    <td className="py-1.5 pr-3">{r.cerradasHoy}</td>
                    <td className="py-1.5 pr-3">{r.conAlertas}</td>
                    <td className="py-1.5 pr-3">{r.slaExcedidos}</td>
                    <td className="py-1.5">{r.enRiesgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
