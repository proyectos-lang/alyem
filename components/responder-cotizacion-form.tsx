"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { responderCotizacion } from "@/lib/actions/cotizaciones"

interface Linea {
  concepto: string
  monto: string
  moneda: string
}

export function ResponderCotizacionForm({ cotizacionId }: { cotizacionId: string }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [lineas, setLineas] = useState<Linea[]>([{ concepto: "Honorarios de agencia", monto: "", moneda: "HNL" }])

  function set(i: number, patch: Partial<Linea>) {
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set("cotizacion_id", cotizacionId)
    for (const l of lineas) {
      if (!l.concepto || !l.monto) continue
      fd.append("concepto", l.concepto)
      fd.append("monto", l.monto)
      fd.append("moneda", l.moneda)
    }
    startTransition(async () => {
      await responderCotizacion(fd)
      close()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Label>Líneas estimadas</Label>
      <div className="flex flex-col gap-2">
        {lineas.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={l.concepto}
              onChange={(e) => set(i, { concepto: e.target.value })}
              placeholder="Concepto"
              className="flex-1"
            />
            <Input
              type="number"
              step="any"
              value={l.monto}
              onChange={(e) => set(i, { monto: e.target.value })}
              placeholder="Monto"
              className="w-28"
            />
            <Select value={l.moneda} onChange={(e) => set(i, { moneda: e.target.value })} className="w-20">
              <option value="HNL">HNL</option>
              <option value="USD">USD</option>
            </Select>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLineas((ls) => ls.filter((_, idx) => idx !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setLineas((ls) => [...ls, { concepto: "", monto: "", moneda: "HNL" }])}>
        <Plus /> Agregar línea
      </Button>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar respuesta"}
        </Button>
      </div>
    </form>
  )
}
