"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { registrarDocumento } from "@/lib/actions/documentos"
import { firmarSubidaAdjunto } from "@/lib/actions/adjuntos"
import { getSupabaseBrowser } from "@/lib/supabase/client"
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
    const tipoId = (fd.get("tipo_documento_id") as string) || null
    // Varios archivos: todos quedan con el mismo tipo seleccionado.
    const archivos = (fd.getAll("archivo") as File[]).filter((f) => f && f.size > 0)
    if (archivos.length === 0) {
      setError("Selecciona al menos un archivo.")
      return
    }
    startTransition(async () => {
      const sb = getSupabaseBrowser()
      if (!sb) {
        setError("No se pudo inicializar la subida.")
        toast.error("No se pudo inicializar la subida.")
        return
      }
      let ok = 0
      const fallidos: string[] = []
      // Al subir VARIOS, deben coexistir (no versionarse entre sí). Con un solo
      // archivo se mantiene el versionado/reemplazo del documento del mismo tipo.
      const versionar = archivos.length === 1
      // Sube cada archivo directo a Storage (navegador → Supabase, evita el 413) y
      // lo registra. Un fallo en uno no aborta los demás.
      for (const file of archivos) {
        try {
          const { bucket, path, token } = await firmarSubidaAdjunto(gestionId, file.name)
          const up = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type || undefined })
          if (up.error) throw new Error(up.error.message)
          await registrarDocumento(gestionId, tipoId, path, file.name, versionar)
          ok++
        } catch (err) {
          fallidos.push(`${file.name}: ${(err as Error).message}`)
        }
      }
      if (ok > 0) toast.success(ok === 1 ? "Documento subido." : `${ok} documentos subidos.`)
      if (fallidos.length > 0) {
        const msg = `No se pudieron subir ${fallidos.length}: ${fallidos.join("; ")}`
        setError(msg)
        toast.error(msg)
      }
      router.refresh()
      if (fallidos.length === 0) close()
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
        <Label>Archivo(s) (PDF o imagen)</Label>
        <Input name="archivo" type="file" accept="application/pdf,image/*" multiple required />
        <span className="text-[11px] text-muted-foreground">Puedes seleccionar varios archivos; todos quedarán con el tipo elegido.</span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Subiendo…" : "Subir documento(s)"}
        </Button>
      </div>
    </form>
  )
}
