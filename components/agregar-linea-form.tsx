"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useModalClose } from "@/components/ui/modal"
import { agregarLinea } from "@/lib/actions/finanzas"
import type { ConceptoCobro } from "@/lib/types"

export function AgregarLineaForm({
  liquidacionId,
  gestionId,
  conceptos,
}: {
  liquidacionId: string
  gestionId: string
  conceptos: ConceptoCobro[]
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("liquidacion_id", liquidacionId)
    fd.set("gestion_id", gestionId)
    startTransition(async () => {
      await agregarLinea(fd)
      close()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Concepto</Label>
        <Select name="concepto_id" defaultValue={conceptos[0]?.id}>
          {conceptos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Descripción (opcional)</Label>
        <Input name="descripcion" placeholder="Ej. DAI 15% sobre CIF" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Monto</Label>
          <Input name="monto" type="number" step="any" min={0} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Moneda</Label>
          <Select name="moneda" defaultValue="HNL">
            <option value="HNL">HNL</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Se paga a</Label>
          <Select name="destinatario" defaultValue="agencia">
            <option value="agencia">Agencia</option>
            <option value="institucion">Institución</option>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Agregando…" : "Agregar cobro"}
        </Button>
      </div>
    </form>
  )
}
