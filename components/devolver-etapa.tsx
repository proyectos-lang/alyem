"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal, useModalClose } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { devolverEtapa } from "@/lib/actions/gestiones"

// Formulario dentro del modal: confirma la devolución con un motivo opcional.
function DevolverForm({ gestionId }: { gestionId: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const motivo = String(fd.get("motivo") ?? "")
    startTransition(async () => {
      try {
        await devolverEtapa(gestionId, motivo)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        La operación volverá a la <strong>etapa anterior</strong> del flujo. Queda registrado en la
        trazabilidad interna como corrección administrativa.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">Motivo (opcional)</Label>
        <Textarea id="motivo" name="motivo" rows={3} placeholder="¿Por qué se devuelve la etapa?" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Devolviendo…" : "Devolver etapa"}
        </Button>
      </div>
    </form>
  )
}

// Botón (solo admin) para devolver la operación a la etapa anterior.
export function DevolverEtapa({ gestionId, deshabilitado }: { gestionId: string; deshabilitado?: boolean }) {
  if (deshabilitado) {
    return (
      <Button variant="outline" disabled>
        <Undo2 /> Devolver etapa
      </Button>
    )
  }
  return (
    <Modal title="Devolver etapa" trigger={<Button variant="outline"><Undo2 /> Devolver etapa</Button>}>
      <DevolverForm gestionId={gestionId} />
    </Modal>
  )
}
