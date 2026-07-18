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
import { getEstados, getTiposDocumento, getConceptos, getCuentas } from "@/lib/data/catalogos"
import { agregarEstado, agregarTipoDocumento, agregarConcepto, agregarCuenta } from "@/lib/actions/catalogos"
import { moneda } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function CatalogosPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los catálogos." />

  const [estados, tipos, conceptos, cuentas] = await Promise.all([
    getEstados(),
    getTiposDocumento(),
    getConceptos(),
    getCuentas(),
  ])

  const campo = (label: string, name: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input name={name} {...props} />
    </div>
  )

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Catálogos" descripcion="Estados, tipos de documento, conceptos de cobro y cuentas bancarias." />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Estados */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Estados</CardTitle>
              <Modal title="Nuevo estado" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarEstado}>
                  {campo("Nombre", "nombre", { required: true })}
                  <div className="grid grid-cols-2 gap-3">
                    {campo("Orden", "orden", { type: "number", defaultValue: 0 })}
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
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="notifica_cliente" defaultChecked className="size-4 accent-[var(--primary)]" />
                    Notifica al cliente
                  </label>
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {estados.map((e) => (
                <EstadoChip key={e.id} nombre={e.nombre} color={e.color} />
              ))}
            </CardContent>
          </Card>

          {/* Tipos de documento */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tipos de documento</CardTitle>
              <Modal title="Nuevo tipo de documento" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarTipoDocumento}>
                  {campo("Nombre", "nombre", { required: true })}
                  {campo("Orden", "orden", { type: "number", defaultValue: 0 })}
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tipos.map((t) => (
                <Badge key={t.id} variant="secondary">{t.nombre}</Badge>
              ))}
            </CardContent>
          </Card>

          {/* Conceptos de cobro */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Conceptos de cobro</CardTitle>
              <Modal title="Nuevo concepto" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarConcepto}>
                  {campo("Nombre", "nombre", { required: true })}
                  {campo("Categoría", "categoria", { placeholder: "impuesto, flete, gasto…" })}
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {conceptos.map((c) => (
                <Badge key={c.id} variant="secondary">{c.nombre}</Badge>
              ))}
            </CardContent>
          </Card>

          {/* Cuentas bancarias */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Cuentas bancarias</CardTitle>
              <Modal title="Nueva cuenta" trigger={<Button size="sm" variant="outline"><Plus /> Agregar</Button>}>
                <AccionForm action={agregarCuenta}>
                  {campo("Banco", "banco", { required: true })}
                  {campo("Número", "numero", { required: true })}
                  {campo("Titular", "titular", { required: true })}
                  <div className="flex flex-col gap-1.5">
                    <Label>Moneda</Label>
                    <Select name="moneda" defaultValue="HNL">
                      <option value="HNL">HNL</option>
                      <option value="USD">USD</option>
                    </Select>
                  </div>
                  {campo("Instrucciones", "instrucciones")}
                </AccionForm>
              </Modal>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {cuentas.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-2.5 text-sm">
                  <p className="font-medium">{c.banco} · {c.moneda}</p>
                  <p className="text-xs text-muted-foreground">{c.numero} · {c.titular}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  )
}
