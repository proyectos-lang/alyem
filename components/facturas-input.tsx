"use client"

import { useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Lista de valores con botón "+" para agregar y "×" para quitar. Guarda todo en
// un único campo oculto (uno por línea), para columnas de texto como
// `numero_factura`. Reutilizable vía `name` / `placeholder` / `addLabel`.
export function FacturasInput({
  name = "numero_factura",
  defaultValue = "",
  placeholder = "N.º de factura",
  addLabel = "Agregar factura",
}: {
  name?: string
  defaultValue?: string
  placeholder?: string
  addLabel?: string
}) {
  const idRef = useRef(0)
  const nuevo = (value = "") => ({ id: idRef.current++, value })
  const [rows, setRows] = useState(() => {
    const init = defaultValue
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
    return (init.length ? init : [""]).map((v) => nuevo(v))
  })

  const set = (id: number, value: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)))
  const add = () => setRows((prev) => [...prev, nuevo()])
  const quitar = (id: number) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : [nuevo()]))

  const joined = rows.map((r) => r.value.trim()).filter(Boolean).join("\n")

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={joined} />
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2">
          <Input value={r.value} onChange={(e) => set(r.id, e.target.value)} placeholder={placeholder} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => quitar(r.id)}
            disabled={rows.length === 1 && !r.value}
            aria-label="Quitar"
            title="Quitar"
          >
            <X />
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </div>
  )
}
