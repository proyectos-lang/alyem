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
          notificaciones.map((n) => {
            const body = (
              <div
                className={cn(
                  "border-b border-border px-3 py-2.5 text-sm last:border-0",
                  !n.leida && "bg-primary/5",
                )}
              >
                <p className={cn(!n.leida && "font-medium")}>{n.mensaje}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{haceCuanto(n.created_at)}</p>
              </div>
            )
            return n.gestion_id ? (
              <Link key={n.id} href={`/g/${n.gestion_id}`} className="block hover:bg-muted/50">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            )
          })
        )}
      </div>
    </Popover>
  )
}
