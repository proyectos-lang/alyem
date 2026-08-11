"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmpresaForm } from "@/components/admin/empresa-form"
import { fecha } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Empresa } from "@/lib/types"

const PAGE_SIZE = 10
type EstadoFiltro = "todas" | "activas" | "inactivas"

export function EmpresasLista({
  empresas,
  conteo,
  operadores,
  asignados,
}: {
  empresas: Empresa[]
  conteo: Record<string, number>
  operadores: { id: string; nombre: string }[]
  asignados: Record<string, string[]>
}) {
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState<EstadoFiltro>("todas")
  const [page, setPage] = useState(1)

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return empresas.filter((e) => {
      if (estado === "activas" && !e.activo) return false
      if (estado === "inactivas" && e.activo) return false
      if (t) {
        const heno = [e.nombre, e.id_fiscal, e.contacto, e.cuenta, e.codigo_sn, e.telefono_1]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!heno.includes(t)) return false
      }
      return true
    })
  }, [empresas, q, estado])

  // Al cambiar filtros, vuelve a la primera página.
  useEffect(() => setPage(1), [q, estado])

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
              <TableHead>Usuarios</TableHead>
              <TableHead>Operadores</TableHead>
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
                  <TableCell>{conteo[e.id] ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {nOps === 0 ? "—" : `${nOps} operador${nOps === 1 ? "" : "es"}`}
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
                      <EmpresaForm empresa={e} operadores={operadores} asignados={asignados[e.id] ?? []} />
                    </Modal>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
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
