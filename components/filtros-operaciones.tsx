"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Save, Trash2, Filter } from "lucide-react"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { EstadoCatalogo, Aduana } from "@/lib/types"

type FiltroGuardado = { nombre: string; estado: string; aduana: string; canal: string }
const STORAGE_KEY = "alyem:operaciones:filtros"

const CANALES = [
  { value: "verde", label: "Verde" },
  { value: "amarillo", label: "Amarillo" },
  { value: "rojo", label: "Rojo" },
]
const TIPOS = [
  { value: "importacion", label: "Importación" },
  { value: "exportacion", label: "Exportación" },
  { value: "transito", label: "Tránsito" },
  { value: "duca_f", label: "DUCA F" },
  { value: "transito_rapido", label: "Tránsito Rápido" },
]

export function FiltrosOperaciones({
  estados,
  aduanas,
  clientesAduaneros = [],
}: {
  estados: EstadoCatalogo[]
  aduanas: Aduana[]
  clientesAduaneros?: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const estado = params.get("estado") ?? ""
  const aduana = params.get("aduana") ?? ""
  const canal = params.get("canal") ?? ""
  const tipo = params.get("tipo") ?? ""
  const ca = params.get("ca") ?? ""

  const [guardados, setGuardados] = useState<FiltroGuardado[]>([])
  const [sel, setSel] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setGuardados(JSON.parse(raw))
    } catch {
      /* sin persistencia */
    }
  }, [])

  const persistir = (next: FiltroGuardado[]) => {
    setGuardados(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* sin persistencia */
    }
  }

  const set = (clave: string, valor: string) => {
    const p = new URLSearchParams(params.toString())
    if (valor) p.set(clave, valor)
    else p.delete(clave)
    router.replace(`${pathname}?${p.toString()}`)
  }

  const limpiar = () => {
    const p = new URLSearchParams(params.toString())
    p.delete("estado")
    p.delete("aduana")
    p.delete("canal")
    p.delete("tipo")
    p.delete("ca")
    router.replace(`${pathname}?${p.toString()}`)
    setSel("")
  }

  const guardar = () => {
    const nombre = window.prompt("Nombre del filtro")?.trim()
    if (!nombre) return
    const filtro: FiltroGuardado = { nombre, estado, aduana, canal }
    persistir([...guardados.filter((g) => g.nombre !== nombre), filtro].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setSel(nombre)
  }

  const aplicar = (nombre: string) => {
    setSel(nombre)
    const g = guardados.find((x) => x.nombre === nombre)
    if (!g) return
    const p = new URLSearchParams(params.toString())
    g.estado ? p.set("estado", g.estado) : p.delete("estado")
    g.aduana ? p.set("aduana", g.aduana) : p.delete("aduana")
    g.canal ? p.set("canal", g.canal) : p.delete("canal")
    router.replace(`${pathname}?${p.toString()}`)
  }

  const eliminar = () => {
    if (!sel) return
    persistir(guardados.filter((g) => g.nombre !== sel))
    setSel("")
  }

  const hayFiltro = !!(estado || aduana || canal || tipo || ca)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Filter className="size-3.5" /> Filtros
      </span>
      <Select value={tipo} onChange={(e) => set("tipo", e.target.value)} className="h-8 w-44 text-sm">
        <option value="">Tipo: todos</option>
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </Select>
      <Select value={estado} onChange={(e) => set("estado", e.target.value)} className="h-8 w-44 text-sm">
        <option value="">Estado: todos</option>
        {estados.map((s) => (
          <option key={s.id} value={s.nombre}>{s.nombre}</option>
        ))}
      </Select>
      <Select value={aduana} onChange={(e) => set("aduana", e.target.value)} className="h-8 w-44 text-sm">
        <option value="">Aduana: todas</option>
        {aduanas.map((a) => (
          <option key={a.id} value={a.id}>{a.nombre}</option>
        ))}
      </Select>
      <Select value={canal} onChange={(e) => set("canal", e.target.value)} className="h-8 w-36 text-sm">
        <option value="">Canal: todos</option>
        {CANALES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </Select>
      {clientesAduaneros.length > 0 && (
        <Select value={ca} onChange={(e) => set("ca", e.target.value)} className="h-8 w-48 text-sm">
          <option value="">Cliente aduanero: todos</option>
          <option value="__all__">Solo clientes aduaneros</option>
          {clientesAduaneros.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </Select>
      )}
      {hayFiltro && (
        <Button size="sm" variant="ghost" onClick={limpiar}>Limpiar</Button>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Select value={sel} onChange={(e) => (e.target.value ? aplicar(e.target.value) : setSel(""))} className="h-8 w-40 text-sm">
          <option value="">Filtros guardados…</option>
          {guardados.map((g) => (
            <option key={g.nombre} value={g.nombre}>{g.nombre}</option>
          ))}
        </Select>
        <Button size="icon-sm" variant="outline" onClick={guardar} title="Guardar filtro actual"><Save /></Button>
        <Button size="icon-sm" variant="ghost" onClick={eliminar} disabled={!sel} title="Eliminar filtro"><Trash2 /></Button>
      </div>
    </div>
  )
}
