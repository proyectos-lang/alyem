"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal, useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { cambiarBL } from "@/lib/actions/gestiones"

function CambiarBLForm({ gestionId, actual }: { gestionId: string; actual: string | null }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const nuevo = String(fd.get("nuevo_bl") ?? "").trim()
    startTransition(async () => {
      try {
        await cambiarBL(gestionId, nuevo)
        toast.success("Número de BL actualizado.")
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
        Usa esto solo cuando la consolidadora cambió el BL. La referencia se actualizará si coincidía con el
        BL, quedará registrado en la trazabilidad y se avisará al cliente.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>BL actual</Label>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">{actual || "—"}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nuevo_bl">Nuevo número de BL</Label>
        <Input id="nuevo_bl" name="nuevo_bl" required autoFocus defaultValue="" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Cambiar BL"}</Button>
      </div>
    </form>
  )
}

export function CambiarBL({ gestionId, actual }: { gestionId: string; actual: string | null }) {
  return (
    <Modal title="Cambiar número de BL" trigger={<Button variant="outline"><FileEdit /> Cambiar BL</Button>}>
      <CambiarBLForm gestionId={gestionId} actual={actual} />
    </Modal>
  )
}
