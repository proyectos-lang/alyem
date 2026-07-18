"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal, useModalClose } from "@/components/ui/modal"
import { anularLinea } from "@/lib/actions/finanzas"

export function AnularLineaBtn({ id, gestionId }: { id: string; gestionId: string }) {
  return (
    <Modal title="Anular línea de cobro" trigger={<Button size="icon-xs" variant="ghost"><Ban /></Button>}>
      <AnularForm id={id} gestionId={gestionId} />
    </Modal>
  )
}

function AnularForm({ id, gestionId }: { id: string; gestionId: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la anulación…" rows={3} />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={pending || !motivo.trim()}
          onClick={() =>
            startTransition(async () => {
              await anularLinea(id, gestionId, motivo.trim())
              close()
              router.refresh()
            })
          }
        >
          Anular línea
        </Button>
      </div>
    </div>
  )
}
