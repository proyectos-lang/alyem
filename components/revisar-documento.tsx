"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal, useModalClose } from "@/components/ui/modal"
import { revisarDocumento } from "@/lib/actions/documentos"

export function RevisarDocumento({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center gap-1">
      <Button
        size="xs"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await revisarDocumento(id, "aceptado")
            router.refresh()
          })
        }
      >
        <Check /> Aceptar
      </Button>
      <Modal title="Rechazar documento" trigger={<Button size="xs" variant="destructive"><X /> Rechazar</Button>}>
        <RechazarDoc id={id} />
      </Modal>
    </div>
  )
}

function RechazarDoc({ id }: { id: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ej. factura ilegible, reenviar)…" rows={3} />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={pending || !motivo.trim()}
          onClick={() =>
            startTransition(async () => {
              await revisarDocumento(id, "rechazado", motivo.trim())
              close()
              router.refresh()
            })
          }
        >
          Rechazar
        </Button>
      </div>
    </div>
  )
}
