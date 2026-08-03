"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { registrarEvento } from "@/lib/actions/gestiones"
import type { EstadoCatalogo } from "@/lib/types"

export function RegistrarEventoForm({
  gestionId,
  estados,
}: {
  gestionId: string
  estados: EstadoCatalogo[]
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<"estado" | "observacion">("estado")
  const [estadoId, setEstadoId] = useState(estados[0]?.id ?? "")

  const esSelectividad = estados.find((e) => e.id === estadoId)?.nombre === "Selectivo"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("gestion_id", gestionId)
    fd.set("tipo", tipo)
    startTransition(async () => {
      try {
        await registrarEvento(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Tipo de registro</Label>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as "estado" | "observacion")}>
          <option value="estado">Cambio de estado</option>
          <option value="observacion">Observación (sin cambiar estado)</option>
        </Select>
      </div>

      {tipo === "estado" && (
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select name="estado_id" value={estadoId} onChange={(e) => setEstadoId(e.target.value)}>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
      )}

      {esSelectividad && (
        <div className="flex flex-col gap-1.5">
          <Label>Canal de selectividad</Label>
          <Select name="canal_selectividad" defaultValue="verde">
            <option value="verde">Verde — levante inmediato</option>
            <option value="amarillo">Amarillo — revisión documental</option>
            <option value="rojo">Rojo — inspección física</option>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Fecha y hora del evento</Label>
        <Input name="fecha_evento" type="datetime-local" />
        <p className="text-xs text-muted-foreground">Déjalo vacío para usar la fecha actual.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Observación</Label>
        <Textarea name="observacion" rows={3} placeholder="Detalle visible para el cliente…" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="interno" className="size-4 accent-[var(--primary)]" />
        Marcar como nota interna (el cliente no la verá)
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar evento"}
        </Button>
      </div>
    </form>
  )
}
