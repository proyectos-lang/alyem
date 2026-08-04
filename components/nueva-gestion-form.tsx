"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { crearGestion } from "@/lib/actions/gestiones"
import type { Aduana, Empresa, TipoDocumento } from "@/lib/types"
import type { Regimen } from "@/lib/data/regimenes"

const BASE = [
  "Documento de transporte",
  "Factura comercial",
  "Traducción / descripción de la carga",
  "Póliza de seguro",
  "Comprobante de pago al proveedor",
]
const PERMISOS = [
  "Permiso ARSA",
  "Certificado de origen (TLC)",
  "Permiso fitosanitario",
  "Permiso SEN",
  "Permiso UTOH",
  "Orden de inspección",
  "Ficha técnica",
]

// Intake del Paso 1. Si viene `empresas`, es la agencia registrando a nombre de un cliente.
export function NuevaGestionForm({
  aduanas,
  tipos,
  empresas,
  regimenes = [],
}: {
  aduanas: Aduana[]
  tipos: TipoDocumento[]
  empresas?: Empresa[]
  regimenes?: Regimen[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [panama, setPanama] = useState(false)

  const base = tipos.filter((t) => BASE.includes(t.nombre))
  const permisos = tipos.filter((t) => PERMISOS.includes(t.nombre))
  const panamaDocs = tipos.filter((t) => t.nombre.includes("Panamá"))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const id = await crearGestion(fd)
        toast.success("Operación creada correctamente.")
        router.push(`/g/${id}`)
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  const docInput = (t: TipoDocumento) => (
    <div key={t.id} className="flex flex-col gap-1.5">
      <Label className="text-xs">{t.nombre}</Label>
      <Input name={`archivo_${t.id}`} type="file" accept="application/pdf,image/*" className="text-xs" />
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Información del embarque</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {empresas && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Empresa cliente</Label>
              <Select name="empresa_id" defaultValue="" required>
                <option value="" disabled>Selecciona la empresa…</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de operación</Label>
            <Select name="tipo_operacion" defaultValue="importacion">
              <option value="importacion">Importación</option>
              <option value="exportacion">Exportación</option>
              <option value="transito">Tránsito (DUCA T)</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Aduana de ingreso</Label>
            <Select name="aduana_id" defaultValue="">
              <option value="">Selecciona…</option>
              {aduanas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
              ))}
            </Select>
          </div>
          {regimenes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Régimen aduanero</Label>
              <Select name="regimen_id" defaultValue="">
                <option value="">Selecciona…</option>
                {regimenes.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Naviera</Label>
            <Input name="naviera" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>ETA (fecha estimada de llegada)</Label>
            <Input name="eta" type="date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Proveedor</Label>
            <Input name="proveedor" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Número de factura</Label>
            <Input name="numero_factura" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contenedor(es)</Label>
            <Input name="contenedores" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Descripción de la carga</Label>
            <Textarea name="descripcion_carga" rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="proviene_panama" checked={panama} onChange={(e) => setPanama(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            La carga proviene de Panamá (requiere documentos adicionales)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos base</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">{base.map(docInput)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permisos y certificados (según la mercancía)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">{permisos.map(docInput)}</CardContent>
      </Card>

      {panama && panamaDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos de Panamá</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">{panamaDocs.map(docInput)}</CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Adjunta lo que tengas disponible; podrás completar documentos después desde el detalle de la operación.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Creando…" : "Crear operación"}</Button>
      </div>
    </form>
  )
}
