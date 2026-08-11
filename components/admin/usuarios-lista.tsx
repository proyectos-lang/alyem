"use client"

import { useMemo, useState } from "react"
import { Pencil, ChevronDown, Search, Users, Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UsuarioForm } from "@/components/admin/usuario-form"
import { UsuarioActivoToggle } from "@/components/admin/usuario-activo-toggle"
import { permisosEfectivos } from "@/lib/permisos"
import { cn } from "@/lib/utils"
import type { Empresa, Rol, Usuario } from "@/lib/types"

const GRUPOS: { rol: Rol; titulo: string; icon: typeof Users }[] = [
  { rol: "cliente", titulo: "Clientes", icon: Building2 },
  { rol: "operador", titulo: "Operadores", icon: Users },
  { rol: "admin", titulo: "Administradores", icon: Shield },
]

export function UsuariosLista({
  usuarios,
  empresas,
  asignados,
}: {
  usuarios: Usuario[]
  empresas: Empresa[]
  asignados: Record<string, string[]>
}) {
  const [q, setQ] = useState("")
  const [rolFiltro, setRolFiltro] = useState<Rol | "todos">("todos")
  const [empresaFiltro, setEmpresaFiltro] = useState<string | null>("")
  const [cerradas, setCerradas] = useState<Set<Rol>>(new Set())

  const empresaNombre = useMemo(() => new Map(empresas.map((e) => [e.id, e.nombre])), [empresas])
  const empresaOptions = useMemo(
    () => [{ value: "", label: "Todas las empresas" }, ...empresas.map((e) => ({ value: e.id, label: e.nombre }))],
    [empresas],
  )

  // Filtro de texto (nombre/usuario/correo) + empresa.
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    const emp = empresaFiltro || ""
    return usuarios.filter((u) => {
      if (t) {
        const heno = `${u.nombre} ${u.usuario ?? ""} ${u.email ?? ""}`.toLowerCase()
        if (!heno.includes(t)) return false
      }
      if (emp) {
        if (u.rol === "cliente") return u.empresa_id === emp
        if (u.rol === "operador") return (asignados[u.id] ?? []).includes(emp)
        return false // admin no tiene empresa
      }
      return true
    })
  }, [usuarios, q, empresaFiltro, asignados])

  function toggleSeccion(rol: Rol) {
    setCerradas((prev) => {
      const next = new Set(prev)
      if (next.has(rol)) next.delete(rol)
      else next.add(rol)
      return next
    })
  }

  function celdaEmpresa(u: Usuario) {
    if (u.rol === "operador") {
      const n = asignados[u.id]?.length ?? 0
      return n === 0 ? "Todos los clientes" : `${n} cliente${n === 1 ? "" : "s"}`
    }
    if (u.rol === "cliente") return u.empresa?.nombre ?? (u.empresa_id ? empresaNombre.get(u.empresa_id) ?? "—" : "—")
    return "—"
  }

  const gruposVisibles = GRUPOS.filter((g) => rolFiltro === "todos" || rolFiltro === g.rol)

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(["todos", "cliente", "operador", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRolFiltro(r)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                rolFiltro === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {r === "todos" ? "Todos" : r === "cliente" ? "Clientes" : r === "operador" ? "Operadores" : "Administradores"}
            </button>
          ))}
        </div>
        <div className="md:ml-auto md:w-64">
          <Combobox
            options={empresaOptions}
            value={empresaFiltro}
            onChange={setEmpresaFiltro}
            placeholder="Filtrar por empresa…"
            buscarPlaceholder="Escribe el nombre de la empresa…"
            emptyText="Sin empresas que coincidan."
          />
        </div>
      </div>

      {/* Secciones colapsables por rol */}
      {gruposVisibles.map((g) => {
        const lista = filtrados.filter((u) => u.rol === g.rol)
        const abierta = !cerradas.has(g.rol)
        const Icon = g.icon
        return (
          <Card key={g.rol} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSeccion(g.rol)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-muted-foreground" />
                {g.titulo}
                <Badge variant="muted">{lista.length}</Badge>
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", abierta && "rotate-180")} />
            </button>

            {abierta && (
              <div className="border-t border-border">
                {lista.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin usuarios que coincidan.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>{g.rol === "operador" ? "Clientes" : "Empresa"}</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{u.usuario ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{celdaEmpresa(u)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.permisos ? `${u.permisos.length} personalizados` : `Por defecto (${permisosEfectivos(u).length})`}
                          </TableCell>
                          <TableCell>
                            {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="muted">Inactivo</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Modal
                                title="Editar usuario"
                                className="max-w-2xl"
                                trigger={
                                  <Button variant="ghost" size="icon-sm">
                                    <Pencil />
                                  </Button>
                                }
                              >
                                <UsuarioForm usuario={u} empresas={empresas} asignados={asignados[u.id] ?? []} />
                              </Modal>
                              <UsuarioActivoToggle id={u.id} activo={u.activo} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
