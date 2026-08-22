"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, UserPlus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SubclienteEmpresaForm } from "@/components/aduanero/subcliente-empresa-form"
import { SubclienteUsuarioForm } from "@/components/aduanero/subcliente-usuario-form"
import { toggleSubclienteUsuario } from "@/lib/actions/subclientes"
import type { Empresa, Usuario } from "@/lib/types"

type UsuarioMin = Pick<Usuario, "id" | "nombre" | "usuario" | "email" | "activo">

function ToggleUsuario({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleSubclienteUsuario(id, !activo)
          router.refresh()
        })
      }
    >
      {activo ? "Desactivar" : "Activar"}
    </Button>
  )
}

export function SubclientesLista({
  empresas,
  usuariosPorEmpresa,
}: {
  empresas: Empresa[]
  usuariosPorEmpresa: Record<string, UsuarioMin[]>
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {empresas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aún no tienes clientes. Crea el primero con “Nuevo cliente”.
        </p>
      ) : (
        empresas.map((emp) => {
          const usuarios = usuariosPorEmpresa[emp.id] ?? []
          return (
            <Card key={emp.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="size-4 text-muted-foreground" />
                  {emp.nombre}
                  {!emp.activo && <Badge variant="muted">Inactivo</Badge>}
                  <Badge variant="muted">{usuarios.length} usuario{usuarios.length === 1 ? "" : "s"}</Badge>
                </span>
                <div className="flex items-center gap-1.5">
                  <Modal title="Nuevo usuario del cliente" trigger={<Button size="sm" variant="outline"><UserPlus /> Usuario</Button>}>
                    <SubclienteUsuarioForm empresaId={emp.id} />
                  </Modal>
                  <Modal title="Editar cliente" trigger={<Button size="icon-sm" variant="ghost"><Pencil /></Button>}>
                    <SubclienteEmpresaForm empresa={emp} />
                  </Modal>
                </div>
              </div>

              {usuarios.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Este cliente todavía no tiene usuarios de acceso.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">{u.usuario ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                        <TableCell>
                          {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="muted">Inactivo</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Modal title="Editar usuario" trigger={<Button variant="ghost" size="icon-sm"><Pencil /></Button>}>
                              <SubclienteUsuarioForm empresaId={emp.id} usuario={u} />
                            </Modal>
                            <ToggleUsuario id={u.id} activo={u.activo} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// Botón de alta reutilizable para la cabecera de la página.
export function NuevoClienteBoton() {
  return (
    <Modal title="Nuevo cliente" trigger={<Button><Plus /> Nuevo cliente</Button>}>
      <SubclienteEmpresaForm />
    </Modal>
  )
}
