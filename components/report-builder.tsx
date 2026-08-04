"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Download, Play, Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { BookmarkPlus } from "lucide-react"
import { toast } from "sonner"
import { guardarDefinicion } from "@/lib/actions/reportes"
import { COLUMNAS_REPORTE, COLUMNAS_DEFAULT } from "@/lib/reportes"
import type { Empresa } from "@/lib/types"
import type { Regimen } from "@/lib/data/regimenes"

type Vista = {
  nombre: string
  cols: string[]
  empresaId: string
  desde: string
  hasta: string
  base: string
  regimen?: string
  tipo?: string
  documento?: string
  producto?: string
}

const STORAGE_KEY = "alyem:reportes:vistas"

export function ReportBuilder({ empresas, regimenes = [] }: { empresas?: Pick<Empresa, "id" | "nombre">[]; regimenes?: Regimen[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const initCols = (params.get("cols")?.split(",").filter(Boolean) ?? COLUMNAS_DEFAULT)
  const [cols, setCols] = useState<Set<string>>(new Set(initCols))
  const [empresaId, setEmpresaId] = useState(params.get("empresa") ?? "")
  const [desde, setDesde] = useState(params.get("desde") ?? "")
  const [hasta, setHasta] = useState(params.get("hasta") ?? "")
  const [base, setBase] = useState(params.get("base") ?? "eta")
  const [regimen, setRegimen] = useState(params.get("regimen") ?? "")
  const [tipo, setTipo] = useState(params.get("tipo") ?? "")
  const [documento, setDocumento] = useState(params.get("documento") ?? "")
  const [producto, setProducto] = useState(params.get("producto") ?? "")

  const [vistas, setVistas] = useState<Vista[]>([])
  const [vistaSel, setVistaSel] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setVistas(JSON.parse(raw))
    } catch {
      /* localStorage no disponible o corrupto */
    }
  }, [])

  function persistir(next: Vista[]) {
    setVistas(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* sin persistencia */
    }
  }

  function guardarVista() {
    const nombre = window.prompt("Nombre de la vista")?.trim()
    if (!nombre) return
    const vista: Vista = { nombre, cols: [...cols], empresaId, desde, hasta, base, regimen, tipo, documento, producto }
    const next = [...vistas.filter((v) => v.nombre !== nombre), vista].sort((a, b) => a.nombre.localeCompare(b.nombre))
    persistir(next)
    setVistaSel(nombre)
  }

  function aplicarVista(nombre: string) {
    setVistaSel(nombre)
    const v = vistas.find((x) => x.nombre === nombre)
    if (!v) return
    setCols(new Set(v.cols))
    setEmpresaId(v.empresaId)
    setDesde(v.desde)
    setHasta(v.hasta)
    setBase(v.base)
    setRegimen(v.regimen ?? "")
    setTipo(v.tipo ?? "")
    setDocumento(v.documento ?? "")
    setProducto(v.producto ?? "")
    const p = new URLSearchParams()
    p.set("cols", v.cols.join(","))
    if (empresas && v.empresaId) p.set("empresa", v.empresaId)
    if (v.desde) p.set("desde", v.desde)
    if (v.hasta) p.set("hasta", v.hasta)
    p.set("base", v.base)
    if (v.regimen) p.set("regimen", v.regimen)
    if (v.tipo) p.set("tipo", v.tipo)
    if (v.documento) p.set("documento", v.documento)
    if (v.producto) p.set("producto", v.producto)
    router.push(`${pathname}?${p.toString()}`)
  }

  function eliminarVista() {
    if (!vistaSel) return
    persistir(vistas.filter((v) => v.nombre !== vistaSel))
    setVistaSel("")
  }

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set("cols", [...cols].join(","))
    if (empresas && empresaId) p.set("empresa", empresaId)
    if (desde) p.set("desde", desde)
    if (hasta) p.set("hasta", hasta)
    p.set("base", base)
    if (regimen) p.set("regimen", regimen)
    if (tipo) p.set("tipo", tipo)
    if (documento.trim()) p.set("documento", documento.trim())
    if (producto.trim()) p.set("producto", producto.trim())
    return p.toString()
  }, [cols, empresaId, desde, hasta, base, regimen, tipo, documento, producto, empresas])

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
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Constructor de reporte</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={vistaSel}
            onChange={(e) => (e.target.value ? aplicarVista(e.target.value) : setVistaSel(""))}
            className="h-8 w-44 text-sm"
          >
            <option value="">Vistas guardadas…</option>
            {vistas.map((v) => (
              <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
            ))}
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={guardarVista}>
            <Save /> Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={eliminarVista} disabled={!vistaSel}>
            <Trash2 /> Eliminar
          </Button>
        </div>
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
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de operación</Label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="importacion">Importación</option>
              <option value="exportacion">Exportación</option>
              <option value="transito">Tránsito</option>
            </Select>
          </div>
          {regimenes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Régimen aduanero</Label>
              <Select value={regimen} onChange={(e) => setRegimen(e.target.value)}>
                <option value="">Todos</option>
                {regimenes.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>N.º de documento</Label>
            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Factura, BL, NP…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Producto</Label>
            <Input value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Descripción, marca, modelo" />
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
          {empresas && (
            <Button
              variant="outline"
              disabled={cols.size === 0}
              onClick={async () => {
                const nombre = window.prompt("Nombre de la definición de reporte")?.trim()
                if (!nombre) return
                const fd = new FormData()
                fd.set("nombre", nombre)
                fd.set("cols", [...cols].join(","))
                if (empresaId) fd.set("empresa", empresaId)
                if (desde) fd.set("desde", desde)
                if (hasta) fd.set("hasta", hasta)
                fd.set("base", base)
                if (regimen) fd.set("regimen", regimen)
                if (tipo) fd.set("tipo", tipo)
                if (documento.trim()) fd.set("documento", documento.trim())
                if (producto.trim()) fd.set("producto", producto.trim())
                fd.set("periodicidad", "manual")
                await guardarDefinicion(fd)
                toast.success(`Definición “${nombre}” guardada.`)
                router.refresh()
              }}
            >
              <BookmarkPlus /> Guardar definición
            </Button>
          )}
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
