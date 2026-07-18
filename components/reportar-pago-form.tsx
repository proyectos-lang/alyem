"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { reportarPago } from "@/lib/actions/finanzas"
import { moneda as fmtMoneda } from "@/lib/format"

export interface LineaPago {
  id: string
  etiqueta: string
  moneda: string
  restante: number
}

export function ReportarPagoForm({
  gestionId,
  liquidacionId,
  lineas,
}: {
  gestionId: string
  liquidacionId: string
  lineas: LineaPago[]
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [montos, setMontos] = useState<Record<string, number>>(
    Object.fromEntries(lineas.map((l) => [l.id, l.restante])),
  )

  const monedaPago = lineas[0]?.moneda ?? "HNL"
  const total = useMemo(() => Object.values(montos).reduce((a, b) => a + (b || 0), 0), [montos])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("gestion_id", gestionId)
    fd.set("liquidacion_id", liquidacionId)
    fd.set("moneda", monedaPago)
    fd.delete("linea_id")
    fd.delete("monto_linea")
    for (const l of lineas) {
      fd.append("linea_id", l.id)
      fd.append("monto_linea", String(montos[l.id] || 0))
    }
    startTransition(async () => {
      try {
        await reportarPago(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>¿Qué líneas cubre este pago?</Label>
        <div className="flex flex-col gap-1.5">
          {lineas.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0 text-sm">
                <p className="truncate">{l.etiqueta}</p>
                <p className="text-xs text-muted-foreground">Restante: {fmtMoneda(l.restante, l.moneda)}</p>
              </div>
              <Input
                type="number"
                step="any"
                min={0}
                max={l.restante}
                value={montos[l.id] ?? 0}
                onChange={(e) => setMontos((m) => ({ ...m, [l.id]: Number(e.target.value) }))}
                className="w-32"
              />
            </div>
          ))}
        </div>
        <p className="text-right text-sm font-medium">Total a reportar: {fmtMoneda(total, monedaPago)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Fecha del pago</Label>
          <Input name="fecha_pago" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Banco / medio</Label>
          <Input name="banco_medio" placeholder="Transferencia, depósito…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Referencia</Label>
          <Input name="referencia" placeholder="No. de transacción" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Comprobante (obligatorio)</Label>
          <Input name="comprobante" type="file" accept="application/pdf,image/*" required />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || total <= 0}>
          {pending ? "Reportando…" : "Reportar pago"}
        </Button>
      </div>
    </form>
  )
}
