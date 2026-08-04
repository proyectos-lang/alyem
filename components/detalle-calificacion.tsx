"use client"

import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { StarDisplay } from "@/components/star-rating"
import { DIMENSIONES } from "@/lib/satisfaccion"
import { fecha } from "@/lib/format"

export interface CalificacionDetalle {
  id: string
  estrellas: number
  comentario: string | null
  created_at: string
  gestion?: { referencia?: string; operador?: { nombre?: string } | null } | null
  empresa?: { nombre?: string } | null
  [key: string]: unknown
}

// Fila clicable que abre un modal con el desglose por ítem de la calificación.
export function DetalleCalificacion({ c }: { c: CalificacionDetalle }) {
  const trigger = (
    <div className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
      <StarDisplay value={c.estrellas} />
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{c.gestion?.referencia}</span> · {c.empresa?.nombre}
        </p>
        {c.comentario && <p className="truncate text-sm text-muted-foreground">“{c.comentario}”</p>}
      </div>
      <span className="ml-auto whitespace-nowrap text-xs text-primary">Ver detalle</span>
    </div>
  )

  return (
    <Modal title={`Calificación · ${c.gestion?.referencia ?? ""}`} trigger={trigger}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Calificación general</p>
            <StarDisplay value={c.estrellas} size="size-6" />
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{c.empresa?.nombre}</p>
            {c.gestion?.operador?.nombre && <p>Operador: {c.gestion.operador.nombre}</p>}
            <p>{fecha(c.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desglose por ítem</p>
          {DIMENSIONES.map((d) => {
            const v = c[d.key] as number | null
            return (
              <div key={d.key} className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
                <span className="text-sm">{d.label}</span>
                {v != null ? <StarDisplay value={v} /> : <Badge variant="muted">Sin calificar</Badge>}
              </div>
            )
          })}
        </div>

        {c.comentario && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comentario</p>
            <p className="mt-1 text-sm">“{c.comentario}”</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
