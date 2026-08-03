"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Download, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { COLUMNAS_REPORTE, COLUMNAS_DEFAULT } from "@/lib/reportes"
import type { Empresa } from "@/lib/types"

export function ReportBuilder({ empresas }: { empresas?: Pick<Empresa, "id" | "nombre">[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const initCols = (params.get("cols")?.split(",").filter(Boolean) ?? COLUMNAS_DEFAULT)
  const [cols, setCols] = useState<Set<string>>(new Set(initCols))
  const [empresaId, setEmpresaId] = useState(params.get("empresa") ?? "")
  const [desde, setDesde] = useState(params.get("desde") ?? "")
  const [hasta, setHasta] = useState(params.get("hasta") ?? "")
  const [base, setBase] = useState(params.get("base") ?? "eta")

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set("cols", [...cols].join(","))
    if (empresas && empresaId) p.set("empresa", empresaId)
    if (desde) p.set("desde", desde)
    if (hasta) p.set("hasta", hasta)
    p.set("base", base)
    return p.toString()
  }, [cols, empresaId, desde, hasta, base, empresas])

  function toggle(key: string) {
    setCols((prev) => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }
  const todos = cols.size === COLUMNAS_REPORTE.length
  const toggleTodos = () =>
    setCols(todos ? new Set() : new Set(COLUMNAS_REPORTE.map((c) => c.key)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Constructor de reporte</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {empresas && (
            <div className="flex flex-col gap-1.5">
              <Label>Cliente</Label>
              <Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
                <option value="">Todos</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Rango sobre</Label>
            <Select value={base} onChange={(e) => setBase(e.target.value)}>
              <option value="eta">ETA</option>
              <option value="solicitud">Fecha de solicitud</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>

        {/* Columnas */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Columnas del reporte</Label>
            <button type="button" onClick={toggleTodos} className="text-xs text-primary hover:underline">
              {todos ? "Quitar todas" : "Seleccionar todas"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {COLUMNAS_REPORTE.map((c) => (
              <label key={c.key} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
                <input type="checkbox" checked={cols.has(c.key)} onChange={() => toggle(c.key)} className="size-4 accent-[var(--primary)]" />
                <span className="truncate">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <a href={`/api/export/reporte?${qs}`} download>
            <Button variant="outline" disabled={cols.size === 0}>
              <Download /> Excel
            </Button>
          </a>
          <Button onClick={() => router.push(`${pathname}?${qs}`)} disabled={cols.size === 0}>
            <Play /> Generar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
