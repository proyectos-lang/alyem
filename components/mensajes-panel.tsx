"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { enviarMensaje } from "@/lib/actions/mensajes"
import { fechaHora } from "@/lib/format"
import type { Mensaje } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MensajesPanel({
  gestionId,
  mensajes,
  usuarioId,
}: {
  gestionId: string
  mensajes: Mensaje[]
  usuarioId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [texto, setTexto] = useState("")

  function enviar() {
    if (!texto.trim()) return
    const t = texto
    setTexto("")
    startTransition(async () => {
      await enviarMensaje(gestionId, t)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
          {mensajes.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin mensajes. Toda la conversación queda ligada a esta gestión.
            </p>
          )}
          {mensajes.map((m) => {
            const mio = m.usuario_id === usuarioId
            return (
              <div key={m.id} className={cn("flex flex-col", mio ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mio ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {m.texto}
                </div>
                <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
                  {m.usuario?.nombre ?? "—"} · {fechaHora(m.created_at)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder="Escribe un mensaje…"
            rows={2}
            className="min-h-10 flex-1"
          />
          <Button onClick={enviar} disabled={pending || !texto.trim()}>
            <Send /> Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
