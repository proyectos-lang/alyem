"use client"

import { useMemo, useState } from "react"
import { EyeOff, MessageSquare } from "lucide-react"
import { EstadoChip, CanalChip } from "@/components/estado-chip"
import { Badge } from "@/components/ui/badge"
import { fecha, fechaHora } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Evento } from "@/lib/types"

type Filtro = "todos" | "estado" | "observacion" | "interno"

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "estado", label: "Estados" },
  { key: "observacion", label: "Observaciones" },
  { key: "interno", label: "Internos" },
]

// Timeline cronológico de eventos, agrupado por día y con filtros por tipo.
export function Timeline({ eventos }: { eventos: Evento[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const hayInternos = useMemo(() => eventos.some((e) => e.interno), [eventos])

  const visibles = useMemo(
    () =>
      eventos.filter((e) => {
        if (filtro === "estado") return e.tipo === "estado"
        if (filtro === "observacion") return e.tipo === "observacion"
        if (filtro === "interno") return e.interno
        return true
      }),
    [eventos, filtro],
  )

  // Agrupa por día conservando el orden (los eventos ya vienen desc por fecha).
  const grupos = useMemo(() => {
    const out: { dia: string; items: Evento[] }[] = []
    for (const e of visibles) {
      const dia = fecha(e.fecha_evento)
      const ultimo = out[out.length - 1]
      if (ultimo && ultimo.dia === dia) ultimo.items.push(e)
      else out.push({ dia, items: [e] })
    }
    return out
  }, [visibles])

  if (eventos.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5 print:hidden">
        {FILTROS.filter((f) => f.key !== "interno" || hayInternos).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filtro === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay eventos de este tipo.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((grupo) => (
            <div key={grupo.dia}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{grupo.dia}</p>
              <ol className="relative flex flex-col gap-0">
                {grupo.items.map((e, i) => (
                  <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i !== grupo.items.length - 1 && (
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
