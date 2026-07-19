"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { crearGestion } from "@/lib/actions/gestiones"
import type { Empresa } from "@/lib/types"

// Si se pasan `empresas`, el formulario es el de la agencia creando a nombre de
// un cliente (muestra el selector de empresa). Si no, es el del propio cliente.
export function NuevaGestionForm({ empresas }: { empresas?: Empresa[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const id = await crearGestion(fd)
        router.push(`/g/${id}`)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
          {empresas && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Empresa cliente</Label>
              <Select name="empresa_id" defaultValue="" required>
                <option value="" disabled>
                  Selecciona la empresa…
                </option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                La gestión se registra a nombre de este cliente y queda aceptada y asignada a ti.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de operación</Label>
            <Select name="tipo_operacion" defaultValue="importacion">
              <option value="importacion">Importación</option>
              <option value="exportacion">Exportación</option>
              <option value="transito">Tránsito</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Modo de transporte</Label>
            <Select name="modo" defaultValue="maritimo">
              <option value="maritimo">Marítimo</option>
              <option value="aereo">Aéreo</option>
              <option value="terrestre">Terrestre</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tu referencia (PO / orden de compra)</Label>
            <Input name="referencia_cliente" placeholder="PO-1234" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>BL / Guía aérea / Carta de porte</Label>
            <Input name="bl" placeholder="MAEU-000000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Naviera / línea</Label>
            <Input name="naviera" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contenedor(es)</Label>
            <Input name="contenedores" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Puerto de origen</Label>
            <Input name="puerto_origen" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Puerto de destino</Label>
            <Input name="puerto_destino" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Proveedor</Label>
            <Input name="proveedor" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>ETA (fecha estimada de arribo)</Label>
            <Input name="eta" type="date" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Descripción de la mercancía</Label>
            <Textarea name="descripcion_mercancia" rows={3} />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {empresas
          ? "Completa lo que tengas del embarque; los datos faltantes se pueden editar después desde el detalle de la operación."
          : "Completa lo que tengas disponible. La agencia validará y completará los datos faltantes al aceptar la gestión."}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear solicitud"}
        </Button>
      </div>
    </form>
  )
}
