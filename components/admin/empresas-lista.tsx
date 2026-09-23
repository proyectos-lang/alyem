"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmpresaForm } from "@/components/admin/empresa-form"
import { UtohBadge } from "@/components/utoh-badge"
import { fecha, fechaCorta } from "@/lib/format"
import { estadoUtoh } from "@/lib/utoh"
import { urlUTOHDoc } from "@/lib/actions/admin"
import { cn } from "@/lib/utils"
import type { Empresa } from "@/lib/types"

const PAGE_SIZE = 10
type EstadoFiltro = "todas" | "activas" | "inactivas"

async function verUtohDoc(id: string) {
  const url = await urlUTOHDoc(id)
  if (url) window.open(url, "_blank")
}

export function EmpresasLista({
  empresas,
  conteo,
  operadores,
  asignados,
  clientesAduaneros = [],
}: {
  empresas: Empresa[]
  conteo: Record<string, number>
  operadores: { id: string; nombre: string }[]
  asignados: Record<string, string[]>
  clientesAduaneros?: { id: string; nombre: string }[]
}) {
  // Nombre del cliente aduanero por id (para mostrarlo en la tabla).
  const caNombre = useMemo(
    () => new Map(clientesAduaneros.map((c) => [c.id, c.nombre])),
    [clientesAduaneros],
  )
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState<EstadoFiltro>("todas")
  const [utohAlerta, setUtohAlerta] = useState(false)
  const [page, setPage] = useState(1)

  // Alarma UTOH: conteo global de permisos vencidos y por vencer.
  const utohResumen = useMemo(() => {
    let vencidos = 0, porVencer = 0
    for (const e of empresas) {
      const s = estadoUtoh(e.utoh_vencimiento).estado
      if (s === "vencido") vencidos++
      else if (s === "por_vencer") porVencer++
    }
    return { vencidos, porVencer }
  }, [empresas])

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return empresas.filter((e) => {
      if (estado === "activas" && !e.activo) return false
      if (estado === "inactivas" && e.activo) return false
      if (utohAlerta) {
        const s = estadoUtoh(e.utoh_vencimiento).estado
        if (s !== "vencido" && s !== "por_vencer") return false
      }
      if (t) {
        const heno = [e.nombre, e.id_fiscal, e.contacto, e.cuenta, e.codigo_sn, e.telefono_1, e.utoh_numero]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!heno.includes(t)) return false
      }
      return true
    })
  }, [empresas, q, estado, utohAlerta])

  // Al cambiar filtros, vuelve a la primera página.
  useEffect(() => setPage(1), [q, estado, utohAlerta])

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, RTN, cuenta, código SN, contacto o teléfono…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(["todas", "activas", "inactivas"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setEstado(s)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-sm capitalize transition-colors",
                estado === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alarma de permisos UTOH (vencidos / por vencer). Clic para filtrar. */}
      {(utohResumen.vencidos > 0 || utohResumen.porVencer > 0) && (
        <button
          type="button"
          onClick={() => setUtohAlerta((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            utohAlerta
              ? "border-primary bg-primary/5"
              : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
          )}
        >
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            <b>Permisos UTOH:</b> {utohResumen.vencidos} vencido{utohResumen.vencidos === 1 ? "" : "s"} · {utohResumen.porVencer} por vencer (≤30 días)
          </span>
          <span className="ml-auto text-xs underline">{utohAlerta ? "Ver todas las empresas" : "Ver solo estas"}</span>
        </button>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>ID fiscal</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Código SN</TableHead>
              <TableHead>Teléfono 1</TableHead>
              <TableHead>Permiso UTOH</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Operadores</TableHead>
              <TableHead>Cliente aduanero</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((e) => {
              const nOps = asignados[e.id]?.length ?? 0
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{e.id_fiscal ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.contacto ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.cuenta ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.codigo_sn ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.telefono_1 ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.utoh_numero || e.utoh_vencimiento || e.utoh_doc_path ? (
                      <div className="flex flex-col items-start gap-0.5">
                        {e.utoh_numero && <span className="text-foreground">{e.utoh_numero}</span>}
                        {e.utoh_vencimiento && <span className="text-[11px]">Vence {fechaCorta(e.utoh_vencimiento)}</span>}
                        <UtohBadge vencimiento={e.utoh_vencimiento} />
                        {e.utoh_doc_path && (
                          <button type="button" onClick={() => verUtohDoc(e.id)} className="text-[11px] font-medium text-primary hover:underline">
                            Ver documento
                          </button>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{conteo[e.id] ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {nOps === 0 ? "—" : `${nOps} operador${nOps === 1 ? "" : "es"}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.cliente_aduanero_id ? (caNombre.get(e.cliente_aduanero_id) ?? "—") : "—"}
                  </TableCell>
                  <TableCell>
                    {e.activo ? <Badge variant="success">Activa</Badge> : <Badge variant="muted">Inactiva</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fecha(e.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Modal
                      title="Editar empresa"
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil />
                        </Button>
                      }
                    >
                      <EmpresaForm empresa={e} operadores={operadores} asignados={asignados[e.id] ?? []} clientesAduaneros={clientesAduaneros} />
                    </Modal>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
                  No hay empresas que coincidan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {filtradas.length} empresa{filtradas.length === 1 ? "" : "s"}
            {filtradas.length > 0 && (
              <> · mostrando {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtradas.length)}</>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pageSafe <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft /> Anterior
            </Button>
            <span className="text-muted-foreground">Página {pageSafe} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
