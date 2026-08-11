"use client"

import { useEffect, useRef, useState } from "react"
import { Command } from "cmdk"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OpcionCombo {
  value: string
  label: string
}

const PANEL =
  "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
const INPUT = "h-9 w-full bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
const ITEM =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm data-[selected=true]:bg-muted"

// Combobox de selección única: se escribe para filtrar por coincidencias y se
// elige una opción. Emite un input oculto (name) para enviarse en formularios.
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecciona…",
  buscarPlaceholder = "Escribe para buscar…",
  emptyText = "Sin coincidencias.",
  id,
  name,
  className,
}: {
  options: OpcionCombo[]
  value: string | null
  onChange: (v: string | null) => void
  placeholder?: string
  buscarPlaceholder?: string
  emptyText?: string
  id?: string
  name?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sel = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
          className,
        )}
      >
        <span className={cn("truncate", !sel && "text-muted-foreground")}>{sel ? sel.label : placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className={PANEL}>
          <Command loop>
            <div className="border-b border-border px-2">
              <Command.Input autoFocus placeholder={buscarPlaceholder} className={INPUT} />
            </div>
            <Command.List className="max-h-56 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  onSelect={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={ITEM}
                >
                  <Check className={cn("size-4 shrink-0", value === o.value ? "text-emerald-600" : "opacity-0")} />
                  <span className="truncate">{o.label}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  )
}

// Combobox de selección múltiple: chips de lo elegido + panel de búsqueda que
// permite marcar/desmarcar varias opciones sin cerrarse.
export function MultiCombobox({
  options,
  values,
  onChange,
  placeholder = "Buscar y agregar…",
  emptyText = "Sin coincidencias.",
}: {
  options: OpcionCombo[]
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  emptyText?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const seleccionadas = options.filter((o) => values.includes(o.value))

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
  }

  return (
    <div className="relative" ref={ref}>
      {seleccionadas.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {seleccionadas.map((o) => (
            <span key={o.value} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
              {o.label}
              <button type="button" onClick={() => toggle(o.value)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <span className="truncate">{placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0" />
      </button>
      {open && (
        <div className={PANEL}>
          <Command loop>
            <div className="border-b border-border px-2">
              <Command.Input autoFocus placeholder="Escribe para buscar…" className={INPUT} />
            </div>
            <Command.List className="max-h-56 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</Command.Empty>
              {options.map((o) => {
                const marcado = values.includes(o.value)
                return (
                  <Command.Item
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => toggle(o.value)}
                    className={ITEM}
                  >
                    <Check className={cn("size-4 shrink-0", marcado ? "text-emerald-600" : "opacity-0")} />
                    <span className="truncate">{o.label}</span>
                  </Command.Item>
                )
              })}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  )
}
