"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus, Send, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal, useModalClose } from "@/components/ui/modal"
import { crearLiquidacion, cambiarEstadoLiquidacion } from "@/lib/actions/finanzas"
import type { EstadoLiquidacion } from "@/lib/types"

export function CrearLiquidacionBtn({ gestionId }: { gestionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const crear = (estado: EstadoLiquidacion) =>
    startTransition(async () => {
      await crearLiquidacion(gestionId, estado)
      router.refresh()
    })
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => crear("borrador")}>
        <Plus /> Nueva liquidación
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => crear("estimada")}>
        <Plus /> Pre-liquidación estimada
      </Button>
    </div>
  )
}

export function LiquidacionTransiciones({
  id,
  gestionId,
  estado,
}: {
  id: string
  gestionId: string
  estado: EstadoLiquidacion
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const cambiar = (e: EstadoLiquidacion) =>
    startTransition(async () => {
      await cambiarEstadoLiquidacion(id, gestionId, e)
      router.refresh()
    })

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(estado === "borrador" || estado === "estimada") && (
        <Button size="xs" disabled={pending} onClick={() => cambiar("emitida")}>
          <Send /> Emitir
        </Button>
      )}
      {estado !== "anulada" && estado !== "pagada" && (
        <Modal title="Anular liquidación" trigger={<Button size="xs" variant="destructive"><Ban /> Anular</Button>}>
          <AnularLiq id={id} gestionId={gestionId} />
        </Modal>
      )}
    </div>
  )
}

function AnularLiq({ id, gestionId }: { id: string; gestionId: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de anulación…" rows={3} />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={pending || !motivo.trim()}
          onClick={() =>
            startTransition(async () => {
              await cambiarEstadoLiquidacion(id, gestionId, "anulada", motivo.trim())
              close()
              router.refresh()
            })
          }
        >
          Anular
        </Button>
      </div>
    </div>
  )
}
