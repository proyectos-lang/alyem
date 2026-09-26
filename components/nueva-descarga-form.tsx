"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { crearCabecera } from "@/lib/actions/descargas"
import type { Aduana, Empresa } from "@/lib/types"
import type { Regimen } from "@/lib/data/regimenes"

const UNIDADES = ["toneladas", "kilos", "libras", "galones", "litros", "unidades", "cajas", "bultos"]

export function NuevaDescargaForm({
  empresas,
  aduanas,
  regimenes = [],
}: {
  empresas: Pick<Empresa, "id" | "nombre">[]
  aduanas: Aduana[]
  regimenes?: Regimen[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Pre-seleccionar el régimen "Almacén fiscal (7000)" si existe.
  const regimen7000 = regimenes.find((r) => /7000|almac[eé]n fiscal/i.test(r.nombre))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await crearCabecera(fd)
      if (!res.ok) {
        setError(res.error)
        toast.error(res.error)
        return
      }
      toast.success("Descarga registrada.")
      router.push(`/agencia/descargas/${res.id}`)
    })
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Cliente</Label>
              <Select name="empresa_id" defaultValue="" required>
                <option value="" disabled>Selecciona el cliente…</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Número de BL</Label>
              <Input name="bl" placeholder="Bill of Lading (opcional)" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Aduana</Label>
              <Select name="aduana_id" defaultValue="">
                <option value="">—</option>
                {aduanas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                ))}
              </Select>
            </div>
            {regimenes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Régimen aduanero</Label>
                <Select name="regimen_id" defaultValue={regimen7000?.id ?? ""}>
                  <option value="">—</option>
                  {regimenes.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Producto</Label>
              <Input name="producto" placeholder="Descripción de la carga" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cantidad total</Label>
              <Input name="cantidad_total" type="number" step="any" min="0" required placeholder="Ej. 1000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unidad</Label>
              <Select name="unidad" defaultValue="toneladas">
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fecha de ingreso</Label>
              <Input name="fecha_ingreso" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fecha de vencimiento</Label>
              <Input name="fecha_vencimiento" type="date" />
              <span className="text-[11px] text-muted-foreground">Plazo en almacén fiscal (se alerta 2 semanas antes).</span>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Observaciones</Label>
              <Textarea name="observaciones" rows={2} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando…" : "Registrar descarga"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
