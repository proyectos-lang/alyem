"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Popover } from "@/components/ui/popover"
import { marcarLeidas } from "@/lib/actions/notificaciones"
import { haceCuanto } from "@/lib/format"
import type { Notificacion } from "@/lib/types"
import { cn } from "@/lib/utils"

type Grupo = {
  key: string
  gestionId: string | null
  titulo: string
  items: Notificacion[]
  sinLeer: number
}

// Agrupa por operación conservando el orden de llegada (más recientes primero).
function agrupar(notificaciones: Notificacion[]): Grupo[] {
  const orden: string[] = []
  const mapa = new Map<string, Grupo>()
  for (const n of notificaciones) {
    const key = n.gestion_id ?? "__general__"
    let g = mapa.get(key)
    if (!g) {
      g = {
        key,
        gestionId: n.gestion_id,
        titulo: n.gestion_id ? (n.gestion?.referencia ?? "Operación") : "General",
        items: [],
        sinLeer: 0,
      }
      mapa.set(key, g)
      orden.push(key)
    }
    g.items.push(n)
    if (!n.leida) g.sinLeer++
  }
  return orden.map((k) => mapa.get(k)!)
}

export function NotificacionesMenu({ notificaciones }: { notificaciones: Notificacion[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const sinLeer = notificaciones.filter((n) => !n.leida).length

  const marcar = () =>
    startTransition(async () => {
      await marcarLeidas()
      router.refresh()
    })

  return (
    <Popover
      align="end"
      className="w-80"
      trigger={
        <span className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background hover:bg-muted">
          <Bell className="size-4.5" />
          {sinLeer > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {sinLeer}
            </span>
          )}
        </span>
      }
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">Notificaciones</p>
        {sinLeer > 0 && (
          <button type="button" onClick={marcar} className="text-xs text-primary hover:underline">
            Marcar leídas
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin notificaciones.</p>
        ) : (
          agrupar(notificaciones).map((grupo) => (
            <div key={grupo.key} className="border-b border-border last:border-0">
              {grupo.gestionId ? (
                <Link
                  href={`/g/${grupo.gestionId}`}
                  className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-1.5 hover:bg-muted"
                >
                  <span className="truncate text-xs font-semibold">{grupo.titulo}</span>
                  {grupo.sinLeer > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {grupo.sinLeer}
                    </span>
                  )}
                </Link>
              ) : (
                <p className="bg-muted/40 px-3 py-1.5 text-xs font-semibold">{grupo.titulo}</p>
              )}
              {grupo.items.map((n) => (
                <div
                  key={n.id}
                  className={cn("px-3 py-2.5 pl-5 text-sm", !n.leida && "bg-primary/5")}
                >
                  <p className={cn(!n.leida && "font-medium")}>{n.mensaje}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{haceCuanto(n.created_at)}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </Popover>
  )
}
