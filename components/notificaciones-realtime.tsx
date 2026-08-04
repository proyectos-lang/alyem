"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Bell, X } from "lucide-react"
import { getSupabaseBrowser, SUPABASE_SCHEMA } from "@/lib/supabase/client"

type Toast = { id: number; mensaje: string; gestionId: string | null }

// Escucha en tiempo real las nuevas notificaciones del usuario y:
//  1) refresca la campana (re-render del server component),
//  2) muestra un toast dentro de la app,
//  3) lanza un aviso nativo del navegador (si el usuario dio permiso).
export function NotificacionesRealtime({ usuarioId }: { usuarioId: string }) {
  const router = useRouter()
  const [toasts, setToasts] = useState<Toast[]>([])
  const contador = useRef(0)

  useEffect(() => {
    const sb = getSupabaseBrowser()
    if (!sb) return // Sin anon key: la campana sigue funcionando al navegar/actualizar.

    // Permiso para avisos nativos (una sola vez, no intrusivo si ya respondió).
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }

    const canal = sb
      .channel(`notis-${usuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: SUPABASE_SCHEMA,
          table: "notificaciones",
          filter: `usuario_id=eq.${usuarioId}`,
        },
        (payload) => {
          const n = payload.new as { mensaje: string; gestion_id: string | null }

          // 1) Actualiza la campana.
          router.refresh()

          // 2) Toast en la app (se descarta solo a los 6 s).
          const id = ++contador.current
          setToasts((prev) => [...prev, { id, mensaje: n.mensaje, gestionId: n.gestion_id }])
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000)

          // 3) Aviso nativo del navegador.
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification("Alyem Customs", { body: n.mensaje, icon: "/logo-alyem.png" })
            } catch {
              /* algunos navegadores restringen Notification fuera de gesto de usuario */
            }
          }
        },
      )
      .subscribe()

    return () => {
      sb.removeChannel(canal)
    }
  }, [usuarioId, router])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-4 print:hidden">
      {toasts.map((t) => {
        const cerrar = () => setToasts((prev) => prev.filter((x) => x.id !== t.id))
        const contenido = (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-right-4">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">Actualización</p>
              <p className="text-sm text-foreground">{t.mensaje}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                cerrar()
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        )
        return t.gestionId ? (
          <Link key={t.id} href={`/g/${t.gestionId}`} onClick={cerrar} className="block">
            {contenido}
          </Link>
        ) : (
          <div key={t.id}>{contenido}</div>
        )
      })}
    </div>
  )
}
