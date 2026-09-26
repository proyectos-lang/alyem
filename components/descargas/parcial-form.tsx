"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { agregarParcial, editarParcial } from "@/lib/actions/descargas"
import type { DescargaParcial } from "@/lib/types"

const iso = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : "")
const tri = (v: boolean | null | undefined) => (v === true ? "si" : v === false ? "no" : "")

// Formulario de un descargo parcial: alta (parcial ausente) o edición.
export function ParcialForm({
  cabeceraId,
  unidad,
  saldo,
  parcial,
}: {
  cabeceraId: string
  unidad: string
  saldo: number // saldo disponible (para la ayuda; el servidor valida de nuevo)
  parcial?: DescargaParcial
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = parcial
        ? await editarParcial(parcial.id, cabeceraId, fd)
        : await agregarParcial(cabeceraId, fd)
      if (!res.ok) {
        setError(res.error)
        toast.error(res.error)
        return
      }
      toast.success(parcial ? "Descargo actualizado." : "Descargo registrado.")
      close()
      router.refresh()
    })
  }

  // Saldo máximo permitido: el disponible + lo que ya tenía este parcial (si edita).
  const maximo = parcial ? saldo + Number(parcial.cantidad) : saldo

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Cantidad retirada ({unidad})</Label>
          <Input name="cantidad" type="number" step="any" min="0" max={maximo} required defaultValue={parcial?.cantidad ?? ""} />
          <span className="text-[11px] text-muted-foreground">Disponible: {maximo.toLocaleString("es-HN", { maximumFractionDigits: 3 })} {unidad}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fecha</Label>
          <Input name="fecha" type="date" defaultValue={iso(parcial?.fecha)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Número de declaración</Label>
          <Input name="correlativo_liquidacion" defaultValue={parcial?.correlativo_liquidacion ?? ""} placeholder="Correlativo de liquidación" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Canal selectivo</Label>
          <Select name="canal_selectivo" defaultValue={parcial?.canal_selectivo ?? ""}>
            <option value="">—</option>
            <option value="verde">Verde</option>
            <option value="amarillo">Amarillo</option>
            <option value="rojo">Rojo</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Boletín emitido</Label>
          <Select name="boletin_enviado" defaultValue={tri(parcial?.boletin_enviado)}>
            <option value="">—</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Boletín pagado</Label>
          <Select name="boletin_pagado" defaultValue={tri(parcial?.boletin_pagado)}>
            <option value="">—</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Observaciones</Label>
          <Textarea name="observaciones" rows={2} defaultValue={parcial?.observaciones ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : parcial ? "Guardar cambios" : "Registrar descargo"}
        </Button>
      </div>
    </form>
  )
}
