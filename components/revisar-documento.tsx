"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, MessageSquarePlus } from "lucide-react"
import { toast } from "sonner"
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
            await revisarDocumento(id)
            toast.success("Documento aceptado.")
            router.refresh()
          })
        }
      >
        <Check /> Aceptar
      </Button>
      <Modal title="Aceptar con observaciones" trigger={<Button size="xs" variant="outline"><MessageSquarePlus /> Con observaciones</Button>}>
        <AceptarConObservaciones id={id} />
      </Modal>
    </div>
  )
}

function AceptarConObservaciones({ id }: { id: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [obs, setObs] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Acepta el documento y deja una nota al cliente (ej. falta información, corregir un dato, etc.).
      </p>
      <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones para el cliente…" rows={3} />
      <div className="flex justify-end">
        <Button
          disabled={pending || !obs.trim()}
          onClick={() =>
            startTransition(async () => {
              await revisarDocumento(id, obs.trim())
              toast.success("Aceptado con observaciones.")
              close()
              router.refresh()
            })
          }
        >
          Aceptar con observaciones
        </Button>
      </div>
    </div>
  )
}
