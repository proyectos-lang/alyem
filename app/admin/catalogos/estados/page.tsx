import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { EstadoChip } from "@/components/estado-chip"
import { AccionForm } from "@/components/accion-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { Pencil } from "lucide-react"
import { getEstados, getTiposDocumento } from "@/lib/data/catalogos"
import { listarRegimenes } from "@/lib/data/regimenes"
import { agregarEstado, agregarTipoDocumento, actualizarSlaEstado, agregarRegimen } from "@/lib/actions/catalogos"

export const dynamic = "force-dynamic"

export default async function CatalogosPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los catálogos." />

  const [estados, tipos, regimenes] = await Promise.all([getEstados(), getTiposDocumento(), listarRegimenes(false)])

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Catálogos" descripcion="Etapas del proceso y tipos de documento." />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Estados / etapas */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Etapas del proceso</CardTitle>
              <Modal title="Nueva etapa" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarEstado}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Nombre</Label>
                    <Input name="nombre" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Orden</Label>
                      <Input name="orden" type="number" defaultValue={0} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Color</Label>
                      <Input name="color" type="color" defaultValue="#64748b" className="h-9 p-1" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo</Label>
                    <Select name="tipo" defaultValue="normal">
                      <option value="normal">Normal</option>
                      <option value="pausa">Pausa</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="final">Final</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>SLA de la etapa (días, opcional)</Label>
                    <Input name="sla_dias" type="number" min={0} placeholder="Ej. 3" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="notifica_cliente" defaultChecked className="size-4 accent-[var(--primary)]" />
                    Notifica al cliente
                  </label>
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {estados.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <EstadoChip nombre={e.nombre} color={e.color} />
                  <div className="flex items-center gap-2">
                    <Badge variant={e.sla_dias != null ? "secondary" : "muted"}>
                      {e.sla_dias != null ? `SLA ${e.sla_dias}d` : "Sin SLA"}
                    </Badge>
                    <Modal title={`SLA de “${e.nombre}”`} trigger={<Button size="icon-sm" variant="ghost"><Pencil /></Button>}>
                      <AccionForm action={actualizarSlaEstado}>
                        <input type="hidden" name="id" value={e.id} />
                        <div className="flex flex-col gap-1.5">
                          <Label>SLA objetivo (días). Vacío = sin objetivo.</Label>
                          <Input name="sla_dias" type="number" min={0} defaultValue={e.sla_dias ?? ""} />
                        </div>
                      </AccionForm>
                    </Modal>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tipos de documento */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tipos de documento</CardTitle>
              <Modal title="Nuevo tipo de documento" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarTipoDocumento}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Nombre</Label>
                    <Input name="nombre" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Orden</Label>
                    <Input name="orden" type="number" defaultValue={0} />
                  </div>
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tipos.map((t) => (
                <Badge key={t.id} variant="secondary">{t.nombre}</Badge>
              ))}
            </CardContent>
          </Card>

          {/* Regímenes aduaneros */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Regímenes aduaneros</CardTitle>
              <Modal title="Nuevo régimen" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarRegimen}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Nombre</Label>
                    <Input name="nombre" required placeholder="Ej. Importación temporal" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Orden</Label>
                    <Input name="orden" type="number" defaultValue={0} />
                  </div>
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {regimenes.length === 0 && <p className="text-sm text-muted-foreground">Corre <code>supabase/analitica.sql</code> para habilitar los regímenes.</p>}
              {regimenes.map((r) => (
                <Badge key={r.id} variant="secondary">{r.nombre}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  )
}
