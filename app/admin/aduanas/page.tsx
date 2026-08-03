import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AccionForm } from "@/components/accion-form"
import { ImportarAduanas } from "@/components/admin/importar-aduanas"
import { AduanaToggle } from "@/components/admin/aduana-toggle"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarAduanas } from "@/lib/data/aduanas"
import { guardarAduana } from "@/lib/actions/aduanas"

export const dynamic = "force-dynamic"

export default async function AduanasPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el maestro de aduanas." />
  const aduanas = await listarAduanas()

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1000px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Maestro de aduanas"
          descripcion="Aduanas de ingreso con su código. Carga masiva por Excel/CSV o alta manual."
          acciones={
            <div className="flex items-center gap-2">
              <ImportarAduanas />
              <Modal title="Nueva aduana" trigger={<Button><Plus /> Nueva aduana</Button>}>
                <AccionForm action={guardarAduana}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Nombre</Label>
                    <Input name="nombre" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Código</Label>
                    <Input name="codigo" required className="uppercase" />
                  </div>
                </AccionForm>
              </Modal>
            </div>
          }
        />

        <Card className="mt-6 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aduana</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aduanas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nombre}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{a.codigo}</TableCell>
                  <TableCell>
                    {a.activo ? <Badge variant="success">Activa</Badge> : <Badge variant="muted">Inactiva</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Modal title="Editar aduana" trigger={<Button size="xs" variant="ghost">Editar</Button>}>
                        <AccionForm action={guardarAduana}>
                          <input type="hidden" name="id" value={a.id} />
                          <div className="flex flex-col gap-1.5">
                            <Label>Nombre</Label>
                            <Input name="nombre" defaultValue={a.nombre} required />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label>Código</Label>
                            <Input name="codigo" defaultValue={a.codigo} required className="uppercase" />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="activo" defaultChecked={a.activo} className="size-4 accent-[var(--primary)]" />
                            Activa
                          </label>
                        </AccionForm>
                      </Modal>
                      <AduanaToggle id={a.id} activo={a.activo} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {aduanas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No hay aduanas. Impórtalas desde Excel/CSV o agrégalas manualmente.
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
