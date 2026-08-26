"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { UserPlus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal, useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { crearGestion } from "@/lib/actions/gestiones"
import { firmarSubidaAdjunto, registrarAdjunto } from "@/lib/actions/adjuntos"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { crearClienteRapido } from "@/lib/actions/clientes"
import type { Aduana, Empresa, TipoDocumento } from "@/lib/types"
import type { Regimen } from "@/lib/data/regimenes"

const BASE = [
  "Documento de transporte",
  "Factura comercial",
  "Traducción / descripción de la carga",
  "Póliza de seguro",
  "Comprobante de pago al proveedor",
]
const PERMISOS_DOC = [
  "Permiso ARSA",
  "Certificado de origen (TLC)",
  "Permiso fitosanitario",
  "Permiso SEN",
  "Permiso UTOH",
  "Orden de inspección",
  "Ficha técnica",
]

// Intake del Paso 1. Si viene `empresas`, es la agencia (formulario completo +
// alta rápida de cliente). El cliente solo registra el N.º de BL + adjuntos.
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
  const [subiendo, setSubiendo] = useState<{ i: number; total: number } | null>(null)

  const esAgencia = !!empresas
  const [empresasLocal, setEmpresasLocal] = useState<Pick<Empresa, "id" | "nombre">[]>(empresas ?? [])
  const [empresaId, setEmpresaId] = useState("")

  const base = tipos.filter((t) => BASE.includes(t.nombre))
  const permisos = tipos.filter((t) => PERMISOS_DOC.includes(t.nombre))
  const panamaDocs = tipos.filter((t) => t.nombre.includes("Panamá"))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (esAgencia && !empresaId) {
      setError("Selecciona o crea la empresa cliente.")
      return
    }
    const fd = new FormData(e.currentTarget)
    if (esAgencia) fd.set("empresa_id", empresaId)

    // Los archivos NO se envían por el server action (límite de body de Vercel → 413).
    // Se suben directo del navegador a Storage tras crear la operación.
    const archivos: { tipoId: string; file: File }[] = []
    for (const key of [...new Set(fd.keys())].filter((k) => k.startsWith("archivo_"))) {
      const tipoId = key.slice("archivo_".length)
      for (const v of fd.getAll(key)) if (v instanceof File && v.size > 0) archivos.push({ tipoId, file: v })
      fd.delete(key)
    }

    startTransition(async () => {
      try {
        const id = await crearGestion(fd)
        // Subir cada adjunto directo a Storage (navegador → Supabase, sin server action).
        // Secuencial, con progreso por archivo; si uno falla, sigue con los demás.
        const fallidos: string[] = []
        for (let i = 0; i < archivos.length; i++) {
          const { tipoId, file } = archivos[i]
          setSubiendo({ i: i + 1, total: archivos.length })
          try {
            const { bucket, path, token } = await firmarSubidaAdjunto(id, file.name)
            const sb = getSupabaseBrowser()
            if (!sb) throw new Error("No se pudo inicializar la subida.")
            const up = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type || undefined })
            if (up.error) throw new Error(up.error.message)
            await registrarAdjunto(id, tipoId || null, path, file.name)
          } catch {
            fallidos.push(file.name)
          }
        }
        setSubiendo(null)
        if (fallidos.length) {
          toast.warning(`Operación creada, pero fallaron ${fallidos.length} adjunto(s): ${fallidos.join(", ")}. Puedes volver a subirlos desde el detalle.`)
        } else {
          toast.success("Operación creada correctamente.")
        }
        router.push(`/g/${id}`)
      } catch (err) {
        setSubiendo(null)
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  const docInput = (t: TipoDocumento) => (
    <div key={t.id} className="flex flex-col gap-1.5">
      <Label className="text-xs">{t.nombre}</Label>
      <Input name={`archivo_${t.id}`} type="file" multiple accept="application/pdf,image/*" className="text-xs" />
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{esAgencia ? "Información del embarque" : "Notificación del embarque"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Empresa cliente + alta rápida (solo agencia) */}
          {esAgencia && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Empresa cliente</Label>
              <div className="flex items-center gap-2">
                <Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="flex-1" required>
                  <option value="" disabled>Selecciona la empresa…</option>
                  {empresasLocal.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </Select>
                <Modal title="Nuevo cliente" trigger={<Button type="button" variant="outline"><UserPlus /> Nuevo</Button>}>
                  <NuevoClienteRapido
                    onCreado={(emp) => {
                      setEmpresasLocal((prev) => [...prev, emp].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                      setEmpresaId(emp.id)
                    }}
                  />
                </Modal>
              </div>
            </div>
          )}

          {/* Número de BL = referencia (siempre) */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Número de BL / documento de transporte</Label>
            <Input name="numero_bl" required placeholder="Se usará como referencia de la operación" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Número de orden de compra</Label>
            <Input name="numero_orden_compra" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Número de pedido</Label>
            <Input name="numero_pedido" />
          </div>

          {/* Resto de datos: solo la agencia los registra al recibir */}
          {esAgencia && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de operación</Label>
                <Select name="tipo_operacion" defaultValue="importacion">
                  <option value="importacion">Importación</option>
                  <option value="exportacion">Exportación</option>
                  <option value="transito">Tránsito (DUCA T)</option>
                  <option value="duca_f">DUCA F</option>
                  <option value="transito_rapido">Tránsito Rápido</option>
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
                <Label>Número(s) de factura</Label>
                <Textarea name="numero_factura" rows={2} placeholder="Uno por línea si son varias" />
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
            </>
          )}
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

      {esAgencia && panama && panamaDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos de Panamá</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">{panamaDocs.map(docInput)}</CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Puedes adjuntar varios archivos por documento.{" "}
        {esAgencia
          ? "Adjunta lo que tengas disponible; podrás completar datos y documentos después desde el detalle."
          : "Ingresa el número de BL y adjunta tus documentos. Alyem registrará el resto de la información al recibirlos."}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={pending}>
          {subiendo ? `Subiendo ${subiendo.i} de ${subiendo.total}…` : pending ? "Creando…" : "Crear operación"}
        </Button>
      </div>
    </form>
  )
}

// Mini-formulario de alta rápida de cliente (dentro de un Modal).
function NuevoClienteRapido({ onCreado }: { onCreado: (emp: { id: string; nombre: string }) => void }) {
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const emp = await crearClienteRapido(fd)
        toast.success(`Cliente “${emp.nombre}” creado.`)
        onCreado(emp)
        close()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Nombre del cliente</Label>
        <Input name="nombre" required autoFocus />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>ID fiscal (RTN)</Label>
          <Input name="id_fiscal" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Contacto</Label>
          <Input name="contacto" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}><Plus /> {pending ? "Creando…" : "Crear cliente"}</Button>
      </div>
    </form>
  )
}
