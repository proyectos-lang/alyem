import { Plus, Pencil } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UsuarioForm } from "@/components/admin/usuario-form"
import { UsuarioActivoToggle } from "@/components/admin/usuario-activo-toggle"
import { getSupabase } from "@/lib/supabase/server"
import { permisosEfectivos } from "@/lib/permisos"
import type { Empresa, Usuario, Rol } from "@/lib/types"

export const dynamic = "force-dynamic"

const ROL_LABEL: Record<Rol, string> = { cliente: "Cliente", operador: "Operador", admin: "Administrador" }
const ROL_VARIANT: Record<Rol, "default" | "secondary" | "warning"> = {
  cliente: "secondary",
  operador: "default",
  admin: "warning",
}

export default async function UsuariosPage() {
  const sb = getSupabase()
  const [{ data: us }, { data: emp }, { data: asig }] = await Promise.all([
    sb.from("usuarios").select("*, empresa:empresas(id, nombre)").order("rol").order("nombre"),
    sb.from("empresas").select("*").eq("activo", true).order("nombre"),
    sb.from("operador_empresas").select("usuario_id, empresa_id"),
  ])
  const usuarios = (us as Usuario[]) ?? []
  const empresas = (emp as Empresa[]) ?? []

  // Mapa usuario_id → [empresa_id] con los clientes asignados a cada operador.
  const asignadosPorUsuario = new Map<string, string[]>()
  for (const a of (asig as { usuario_id: string; empresa_id: string }[]) ?? []) {
    const arr = asignadosPorUsuario.get(a.usuario_id) ?? []
    arr.push(a.empresa_id)
    asignadosPorUsuario.set(a.usuario_id, arr)
  }

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Usuarios y permisos"
          descripcion="Gestiona las personas y qué puede hacer cada una (sin AUTH; los permisos gobiernan las acciones)."
          acciones={
            <Modal title="Nuevo usuario" className="max-w-2xl" trigger={<Button><Plus /> Nuevo usuario</Button>}>
              <UsuarioForm empresas={empresas} />
            </Modal>
          }
        />

        <Card className="mt-6 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{u.usuario ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ROL_VARIANT[u.rol]}>{ROL_LABEL[u.rol]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.rol === "operador"
                      ? (() => {
                          const n = asignadosPorUsuario.get(u.id)?.length ?? 0
                          return n === 0 ? "Todos los clientes" : `${n} cliente${n === 1 ? "" : "s"}`
                        })()
                      : u.empresa?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.permisos
                      ? `${u.permisos.length} personalizados`
                      : `Por defecto (${permisosEfectivos(u).length})`}
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
                        <UsuarioForm usuario={u} empresas={empresas} asignados={asignadosPorUsuario.get(u.id) ?? []} />
                      </Modal>
                      <UsuarioActivoToggle id={u.id} activo={u.activo} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PortalShell>
  )
}
