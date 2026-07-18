"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { editarDatosGestion } from "@/lib/actions/gestiones"
import type { Gestion } from "@/lib/types"

function iso(d: string | null) {
  return d ? d.slice(0, 10) : ""
}

export function EditarDatosForm({ g }: { g: Gestion }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("id", g.id)
    startTransition(async () => {
      try {
        await editarDatosGestion(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  const T = (name: keyof Gestion, label: string) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input name={name} defaultValue={(g[name] as string) ?? ""} />
    </div>
  )
  const D = (name: keyof Gestion, label: string) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input name={name} type="date" defaultValue={iso(g[name] as string)} />
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {T("referencia_cliente", "Referencia del cliente")}
        {T("consignatario", "Consignatario")}
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de operación</Label>
          <Select name="tipo_operacion" defaultValue={g.tipo_operacion}>
            <option value="importacion">Importación</option>
            <option value="exportacion">Exportación</option>
            <option value="transito">Tránsito</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Modo</Label>
          <Select name="modo" defaultValue={g.modo}>
            <option value="maritimo">Marítimo</option>
            <option value="aereo">Aéreo</option>
            <option value="terrestre">Terrestre</option>
          </Select>
        </div>
        {T("bl", "BL / Guía / Carta de porte")}
        {T("naviera", "Naviera / línea")}
        {T("buque_viaje", "Buque y viaje")}
        {T("contenedores", "Contenedor(es)")}
        {T("tipo_contenedor", "Tipo de contenedor")}
        {T("proveedor", "Proveedor")}
        {T("puerto_origen", "Puerto de origen")}
        {T("puerto_destino", "Puerto de destino")}
        {D("eta", "ETA")}
        {D("fecha_arribo", "Arribo real")}
        {D("fecha_liberacion", "Liberación")}
        {D("fecha_entrega", "Entrega")}
        {D("fecha_inicio_libres", "Inicio de días libres")}
        <div className="flex flex-col gap-1.5">
          <Label>Días libres</Label>
          <Input name="dias_libres" type="number" defaultValue={g.dias_libres ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Unidades importadas (para landed cost)</Label>
          <Input name="unidades_importadas" type="number" step="any" defaultValue={g.unidades_importadas ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Descripción de la mercancía</Label>
        <Textarea name="descripcion_mercancia" rows={2} defaultValue={g.descripcion_mercancia ?? ""} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
