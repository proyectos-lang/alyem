"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal, useModalClose } from "@/components/ui/modal"
import { verificarPago } from "@/lib/actions/finanzas"

export function VerificarPago({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center gap-1">
      <Button
        size="xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await verificarPago(id, "verificado")
            router.refresh()
          })
        }
      >
        <Check /> Verificar
      </Button>
      <Modal title="Rechazar pago" trigger={<Button size="xs" variant="destructive"><X /> Rechazar</Button>}>
        <RechazarPago id={id} />
      </Modal>
    </div>
  )
}

function RechazarPago({ id }: { id: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ej. el monto no coincide)…" rows={3} />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={pending || !motivo.trim()}
          onClick={() =>
            startTransition(async () => {
              await verificarPago(id, "rechazado", motivo.trim())
              close()
              router.refresh()
            })
          }
        >
          Rechazar pago
        </Button>
      </div>
    </div>
  )
}
