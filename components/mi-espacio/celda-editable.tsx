"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { guardarValor } from "@/lib/actions/mi-espacio"

// Celda editable de "Mi espacio". Guarda al salir (onBlur) o al cambiar (select),
// fusionando la clave en la bolsa jsonb de la operación. Solo lectura si !editable.
export function CeldaEditable({
  gestionId,
  clave,
  tipo,
  opciones,
  valor,
  editable,
}: {
  gestionId: string
  clave: string
  tipo: string
  opciones: string[] | null
  valor: string
  editable: boolean
}) {
  const [v, setV] = useState(valor)
  const [pending, start] = useTransition()
  const [ok, setOk] = useState(false)

  if (!editable) {
    const txt = tipo === "bool" ? (valor === "si" ? "Sí" : valor === "no" ? "No" : "") : valor
    return <span className="text-sm">{txt || "—"}</span>
  }

  const guardar = (nuevo: string) => {
    if (nuevo === valor) return
    start(async () => {
      try {
        await guardarValor(gestionId, clave, nuevo)
        setOk(true)
        setTimeout(() => setOk(false), 900)
      } catch {
        /* se conserva el valor local; el usuario puede reintentar */
      }
    })
  }

  if (tipo === "select") {
    return (
      <Select
        value={v}
        onChange={(e) => { setV(e.target.value); guardar(e.target.value) }}
        disabled={pending}
        className="h-8 min-w-[8rem] text-sm"
      >
        <option value="">—</option>
        {(opciones ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    )
  }
  if (tipo === "bool") {
    return (
      <Select
        value={v}
        onChange={(e) => { setV(e.target.value); guardar(e.target.value) }}
        disabled={pending}
        className="h-8 w-20 text-sm"
      >
        <option value="">—</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </Select>
    )
  }
  const type = tipo === "num" ? "number" : tipo === "date" ? "date" : "text"
  return (
    <Input
      type={type}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => guardar(v)}
      disabled={pending}
      className={`h-8 min-w-[9rem] text-sm ${ok ? "border-emerald-400" : ""}`}
    />
  )
}
