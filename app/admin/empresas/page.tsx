import { Plus, Pencil } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmpresaForm } from "@/components/admin/empresa-form"
import { getSupabase } from "@/lib/supabase/server"
import { fecha } from "@/lib/format"
import type { Empresa } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function EmpresasPage() {
  const sb = getSupabase()
  const [{ data }, { data: us }, { data: operadores }, { data: asig }] = await Promise.all([
    sb.from("empresas").select("*").order("nombre"),
    sb.from("usuarios").select("empresa_id"),
    sb.from("usuarios").select("id, nombre").eq("rol", "operador").eq("activo", true).order("nombre"),
    sb.from("operador_empresas").select("usuario_id, empresa_id"),
  ])
  const empresas = (data as Empresa[]) ?? []
  const listaOperadores = (operadores as { id: string; nombre: string }[]) ?? []

  // Conteo de usuarios cliente por empresa.
  const conteo = new Map<string, number>()
  for (const u of (us as { empresa_id: string | null }[]) ?? []) {
    if (u.empresa_id) conteo.set(u.empresa_id, (conteo.get(u.empresa_id) ?? 0) + 1)
  }

  // Operadores asignados por empresa (empresa_id → [usuario_id]).
  const opsPorEmpresa = new Map<string, string[]>()
  for (const a of (asig as { usuario_id: string; empresa_id: string }[]) ?? []) {
    const arr = opsPorEmpresa.get(a.empresa_id) ?? []
    arr.push(a.usuario_id)
    opsPorEmpresa.set(a.empresa_id, arr)
  }

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Empresas cliente"
          descripcion="Alta y edición de empresas importadoras/exportadoras."
          acciones={
            <Modal title="Nueva empresa" trigger={<Button><Plus /> Nueva empresa</Button>}>
              <EmpresaForm operadores={listaOperadores} />
            </Modal>
          }
        />

        <Card className="mt-6 overflow-hidden">
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
              {empresas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{e.id_fiscal ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.contacto ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.cuenta ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.codigo_sn ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.telefono_1 ?? "—"}</TableCell>
                  <TableCell>{conteo.get(e.id) ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(() => {
                      const n = opsPorEmpresa.get(e.id)?.length ?? 0
                      return n === 0 ? "—" : `${n} operador${n === 1 ? "" : "es"}`
                    })()}
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
                      <EmpresaForm empresa={e} operadores={listaOperadores} asignados={opsPorEmpresa.get(e.id) ?? []} />
                    </Modal>
                  </TableCell>
                </TableRow>
              ))}
              {empresas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                    No hay empresas todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PortalShell>
  )
}
