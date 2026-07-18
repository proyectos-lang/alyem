import { FileText, CheckCircle2, Clock, XCircle, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CanalChip } from "@/components/estado-chip"
import { Timeline } from "@/components/timeline"
import { fechaHora } from "@/lib/format"
import type { Documento, Evento } from "@/lib/types"
import type { GestionConEstado } from "@/lib/data/gestiones"

const DOC_ESTADO = {
  aceptado: { icon: CheckCircle2, cls: "text-emerald-600", badge: "success" as const, label: "Validado" },
  pendiente: { icon: Clock, cls: "text-amber-500", badge: "warning" as const, label: "Pendiente" },
  rechazado: { icon: XCircle, cls: "text-destructive", badge: "danger" as const, label: "Rechazado" },
}

// Panel de la pestaña "Operación": evento actual + mini-timeline (izq) y documentos (der).
export function OperacionPanel({
  g,
  eventos,
  documentos,
}: {
  g: GestionConEstado
  eventos: Evento[]
  documentos: Documento[]
}) {
  const eventoActual = eventos.find((e) => e.tipo === "estado") ?? eventos[0]
  const responsable = eventoActual?.usuario?.nombre ?? g.operador?.nombre ?? "Agencia"

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Evento actual + mini-timeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            {g.estado?.nombre ?? "Sin estado"} — {responsable}
            {g.puerto_destino ? ` / ${g.puerto_destino}` : ""}
          </CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {eventoActual?.canal_selectividad && <CanalChip canal={eventoActual.canal_selectividad} />}
            {eventoActual && (
              <span className="text-xs text-muted-foreground">{fechaHora(eventoActual.fecha_evento)}</span>
            )}
            {g.puerto_destino && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {g.puerto_destino}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Timeline eventos={eventos.slice(0, 8)} />
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {documentos.map((d) => {
                const e = DOC_ESTADO[d.estado]
                const Icon = e.icon
                return (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className={`size-4 shrink-0 ${e.cls}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.nombre_archivo}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{d.tipo?.nombre ?? "Documento"}</p>
                      </div>
                    </div>
                    <Badge variant={e.badge}>{e.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
