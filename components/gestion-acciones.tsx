"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, X, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal, useModalClose } from "@/components/ui/modal"
import { RegistrarEventoForm } from "@/components/registrar-evento-form"
import { aceptarGestion, rechazarGestion } from "@/lib/actions/gestiones"
import type { EstadoCatalogo } from "@/lib/types"

export function GestionAcciones({
  gestionId,
  estados,
  esSolicitada,
  puedeAceptar,
  puedeRegistrar,
}: {
  gestionId: string
  estados: EstadoCatalogo[]
  esSolicitada: boolean
  puedeAceptar: boolean
  puedeRegistrar: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {esSolicitada && puedeAceptar && (
        <>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await aceptarGestion(gestionId)
                router.refresh()
              })
            }
          >
            <Check /> Aceptar
          </Button>
          <Modal title="Rechazar solicitud" trigger={<Button variant="destructive"><X /> Rechazar</Button>}>
            <RechazarForm gestionId={gestionId} />
          </Modal>
        </>
      )}
      {puedeRegistrar && !esSolicitada && (
        <Modal
          title="Registrar evento"
          trigger={
            <Button>
              <PlusCircle /> Registrar evento
            </Button>
          }
        >
          <RegistrarEventoForm gestionId={gestionId} estados={estados} />
        </Modal>
      )}
    </div>
  )
}

function RechazarForm({ gestionId }: { gestionId: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState("")

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo del rechazo…"
        rows={3}
      />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={pending || !motivo.trim()}
          onClick={() =>
            startTransition(async () => {
              await rechazarGestion(gestionId, motivo.trim())
              close()
              router.refresh()
            })
          }
        >
          Rechazar solicitud
        </Button>
      </div>
    </div>
  )
}
