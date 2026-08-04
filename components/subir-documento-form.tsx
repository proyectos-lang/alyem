"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { subirDocumento } from "@/lib/actions/documentos"
import type { TipoDocumento } from "@/lib/types"

export function SubirDocumentoForm({
  gestionId,
  tipos,
  tipoFijo,
}: {
  gestionId: string
  tipos: TipoDocumento[]
  tipoFijo?: string
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("gestion_id", gestionId)
    startTransition(async () => {
      try {
        await subirDocumento(fd)
        toast.success("Documento subido.")
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  const nombreFijo = tipoFijo ? tipos.find((t) => t.id === tipoFijo)?.nombre : null

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Tipo de documento</Label>
        {tipoFijo ? (
          // Amarrado a un requerimiento: el tipo queda fijo (no editable).
          <>
            <input type="hidden" name="tipo_documento_id" value={tipoFijo} />
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
              {nombreFijo ?? "Documento solicitado"}
            </div>
          </>
        ) : (
          <Select name="tipo_documento_id" defaultValue={tipos[0]?.id}>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Archivo (PDF o imagen)</Label>
        <Input name="archivo" type="file" accept="application/pdf,image/*" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Subiendo…" : "Subir documento"}
        </Button>
      </div>
    </form>
  )
}
