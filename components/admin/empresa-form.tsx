"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { guardarEmpresa } from "@/lib/actions/admin"
import type { Empresa } from "@/lib/types"

export function EmpresaForm({
  empresa,
  operadores = [],
  asignados = [],
}: {
  empresa?: Empresa
  operadores?: { id: string; nombre: string }[]
  asignados?: string[]
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ops, setOps] = useState<Set<string>>(new Set(asignados))

  function toggleOp(id: string) {
    setOps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.delete("operador_ids")
    for (const id of ops) fd.append("operador_ids", id)
    startTransition(async () => {
      try {
        await guardarEmpresa(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {empresa && <input type="hidden" name="id" value={empresa.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" defaultValue={empresa?.nombre} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="id_fiscal">ID fiscal (RTN)</Label>
          <Input id="id_fiscal" name="id_fiscal" defaultValue={empresa?.id_fiscal ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contacto">Contacto</Label>
          <Input id="contacto" name="contacto" defaultValue={empresa?.contacto ?? ""} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={empresa ? empresa.activo : true}
          className="size-4 accent-[var(--primary)]"
        />
        Empresa activa
      </label>

      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium">Operadores asignados</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Los operadores marcados verán las solicitudes y trámites de esta empresa. Un operador sin
          ninguna empresa asignada ve todas las operaciones.
        </p>
        {operadores.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No hay operadores registrados todavía.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {operadores.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ops.has(o.id)}
                  onChange={() => toggleOp(o.id)}
                  className="size-4 accent-[var(--primary)]"
                />
                {o.nombre}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
