import { EyeOff, MessageSquare } from "lucide-react"
import { EstadoChip, CanalChip } from "@/components/estado-chip"
import { Badge } from "@/components/ui/badge"
import { fechaHora } from "@/lib/format"
import type { Evento } from "@/lib/types"

// Timeline cronológico de eventos (vista principal de la gestión).
export function Timeline({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {eventos.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-6 last:pb-0">
          {/* línea vertical */}
          {i !== eventos.length - 1 && (
            <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />
          )}
          <span
            className="mt-1 size-3.5 shrink-0 rounded-full border-2 border-background"
            style={{ backgroundColor: e.estado?.color ?? "#94a3b8" }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {e.tipo === "estado" && e.estado ? (
                <EstadoChip nombre={e.estado.nombre} color={e.estado.color} />
              ) : (
                <Badge variant="muted">
                  <MessageSquare className="size-3" /> Observación
                </Badge>
              )}
              {e.canal_selectividad && <CanalChip canal={e.canal_selectividad} />}
              {e.interno && (
                <Badge variant="warning">
                  <EyeOff className="size-3" /> Interno
                </Badge>
              )}
              <span className="ml-auto text-xs text-muted-foreground">{fechaHora(e.fecha_evento)}</span>
            </div>
            {e.observacion && <p className="mt-1.5 text-sm text-foreground">{e.observacion}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {e.usuario?.nombre ? `Registrado por ${e.usuario.nombre}` : "Registro automático"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
