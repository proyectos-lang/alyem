"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus, Trash2, Pencil, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { crearColumna, editarColumna, eliminarColumna } from "@/lib/actions/mi-espacio"
import type { ColumnaMiEspacio } from "@/lib/data/mi-espacio"

const TIPOS = [
  { value: "text", label: "Texto" },
  { value: "num", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "bool", label: "Sí / No" },
  { value: "select", label: "Lista de opciones" },
]

function Fila({ columna }: { columna: ColumnaMiEspacio }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [tipo, setTipo] = useState(columna.tipo)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const guardar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("id", columna.id)
    start(async () => {
      try { await editarColumna(fd); setEditando(false); router.refresh() } catch (err) { setError((err as Error).message) }
    })
  }
  const borrar = () => start(async () => { await eliminarColumna(columna.id); router.refresh() })

  if (!editando) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
        <span className="text-sm">
          <span className="font-medium">{columna.label}</span>
          <span className="ml-2 text-xs text-muted-foreground">{TIPOS.find((t) => t.value === columna.tipo)?.label ?? columna.tipo}</span>
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditando(true)} title="Editar"><Pencil /></Button>
          <Button variant="ghost" size="icon-sm" onClick={borrar} disabled={pending} title="Eliminar"><Trash2 /></Button>
        </div>
      </div>
    )
  }
  return (
    <form onSubmit={guardar} className="flex flex-col gap-2 rounded-lg border border-primary/40 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input name="label" defaultValue={columna.label} placeholder="Nombre" required />
        <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </div>
      {tipo === "select" && (
        <Textarea name="opciones" defaultValue={(columna.opciones ?? []).join("\n")} rows={2} placeholder="Una opción por línea" />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}><X /> Cancelar</Button>
        <Button type="submit" size="sm" disabled={pending}><Check /> Guardar</Button>
      </div>
    </form>
  )
}

export function ColumnasEditor({ columnas }: { columnas: ColumnaMiEspacio[] }) {
  const router = useRouter()
  const [tipo, setTipo] = useState("text")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const agregar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    start(async () => {
      try { await crearColumna(fd); form.reset(); setTipo("text"); router.refresh() } catch (err) { setError((err as Error).message) }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {columnas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes columnas. Agrega la primera abajo.</p>
        ) : (
          columnas.map((c) => <Fila key={c.id} columna={c} />)
        )}
      </div>

      <form onSubmit={agregar} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <p className="text-sm font-medium">Nueva columna</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input name="label" placeholder="Ej. Estado de pago" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
        </div>
        {tipo === "select" && (
          <div className="flex flex-col gap-1.5">
            <Label>Opciones (una por línea)</Label>
            <Textarea name="opciones" rows={2} placeholder={"Pendiente\nPagado\nVencido"} />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}><Plus /> {pending ? "Agregando…" : "Agregar columna"}</Button>
        </div>
      </form>
    </div>
  )
}
