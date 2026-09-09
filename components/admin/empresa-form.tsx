"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { UtohBadge } from "@/components/utoh-badge"
import { guardarEmpresa, firmarSubidaUTOH, registrarUTOHDoc, quitarUTOHDoc, urlUTOHDoc } from "@/lib/actions/admin"
import { getSupabaseBrowser } from "@/lib/supabase/client"
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
  const [docPath, setDocPath] = useState<string | null>(empresa?.utoh_doc_path ?? null)

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
    // El documento UTOH se sube directo a Storage (evita el límite de body).
    const file = fd.get("utoh_doc") as File | null
    fd.delete("utoh_doc")
    startTransition(async () => {
      try {
        const { id } = await guardarEmpresa(fd)
        if (file && typeof file !== "string" && file.size > 0) {
          const { bucket, path, token } = await firmarSubidaUTOH(id, file.name)
          const supa = getSupabaseBrowser()
          if (!supa) throw new Error("No se pudo inicializar la subida del documento.")
          const up = await supa.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type || undefined })
          if (up.error) throw new Error(up.error.message)
          await registrarUTOHDoc(id, path)
        }
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  const verDoc = async () => {
    if (!empresa) return
    const url = await urlUTOHDoc(empresa.id)
    if (url) window.open(url, "_blank")
  }
  const quitarDoc = () => {
    if (!empresa) return
    startTransition(async () => {
      await quitarUTOHDoc(empresa.id)
      setDocPath(null)
      router.refresh()
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cuenta">Cuenta</Label>
          <Input id="cuenta" name="cuenta" defaultValue={empresa?.cuenta ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="codigo_sn">Código SN</Label>
          <Input id="codigo_sn" name="codigo_sn" defaultValue={empresa?.codigo_sn ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telefono_1">Teléfono 1</Label>
          <Input id="telefono_1" name="telefono_1" defaultValue={empresa?.telefono_1 ?? ""} />
        </div>
      </div>

      {/* Permiso de UTOH */}
      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium">Permiso de UTOH</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="utoh_numero">Número del permiso</Label>
            <Input id="utoh_numero" name="utoh_numero" defaultValue={empresa?.utoh_numero ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="utoh_vencimiento">Fecha de vencimiento</Label>
            <Input id="utoh_vencimiento" name="utoh_vencimiento" type="date" defaultValue={empresa?.utoh_vencimiento ? String(empresa.utoh_vencimiento).slice(0, 10) : ""} />
            {empresa?.utoh_vencimiento && <span className="mt-1 inline-flex"><UtohBadge vencimiento={empresa.utoh_vencimiento} /></span>}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="utoh_doc">Documento del permiso (PDF o imagen)</Label>
            <Input id="utoh_doc" name="utoh_doc" type="file" accept="application/pdf,image/*" />
            {docPath && (
              <div className="flex items-center gap-3 text-xs">
                <button type="button" onClick={verDoc} className="font-medium text-primary hover:underline">Ver documento actual</button>
                <button type="button" onClick={quitarDoc} className="font-medium text-destructive hover:underline">Quitar</button>
              </div>
            )}
          </div>
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
