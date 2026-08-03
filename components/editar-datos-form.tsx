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
import type { Aduana, Gestion } from "@/lib/types"

// Edición de los datos de cabecera de la operación (Paso 1).
export function EditarDatosForm({ g, aduanas }: { g: Gestion; aduanas: Aduana[] }) {
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

  return (
    <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de operación</Label>
          <Select name="tipo_operacion" defaultValue={g.tipo_operacion}>
            <option value="importacion">Importación</option>
            <option value="exportacion">Exportación</option>
            <option value="transito">Tránsito (DUCA T)</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Aduana de ingreso</Label>
          <Select name="aduana_id" defaultValue={g.aduana_id ?? ""}>
            <option value="">—</option>
            {aduanas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Naviera</Label>
          <Input name="naviera" defaultValue={g.naviera ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>ETA</Label>
          <Input name="eta" type="date" defaultValue={g.eta ? g.eta.slice(0, 10) : ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Proveedor</Label>
          <Input name="proveedor" defaultValue={g.proveedor ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Número de factura</Label>
          <Input name="numero_factura" defaultValue={g.numero_factura ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Contenedor(es)</Label>
          <Input name="contenedores" defaultValue={g.contenedores ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Consignatario</Label>
          <Input name="consignatario" defaultValue={g.consignatario ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Descripción de la carga</Label>
          <Textarea name="descripcion_carga" rows={2} defaultValue={g.descripcion_carga ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </form>
  )
}
