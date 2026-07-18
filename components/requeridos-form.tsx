"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { definirRequeridos } from "@/lib/actions/documentos"
import type { TipoDocumento } from "@/lib/types"

export function RequeridosForm({ gestionId, tipos }: { gestionId: string; tipos: TipoDocumento[] }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [sel, setSel] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("gestion_id", gestionId)
    fd.delete("tipos")
    for (const id of sel) fd.append("tipos", id)
    startTransition(async () => {
      await definirRequeridos(fd)
      close()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Documentos que se solicitan al cliente</Label>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {tipos.map((t) => (
            <label key={t.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
              <input type="checkbox" checked={sel.has(t.id)} onChange={() => toggle(t.id)} className="size-4 accent-[var(--primary)]" />
              {t.nombre}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Nota (opcional)</Label>
        <Textarea name="nota" rows={2} placeholder="Ej. la factura debe venir con Incoterm." />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || sel.size === 0}>
          {pending ? "Guardando…" : "Solicitar documentos"}
        </Button>
      </div>
    </form>
  )
}
