import Link from "next/link"
import { ArrowLeft, Pencil, Building2, Ship, Plane, Truck } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { EstadoChip } from "@/components/estado-chip"
import { Timeline } from "@/components/timeline"
import { DatosGestion } from "@/components/datos-gestion"
import { GestionAcciones } from "@/components/gestion-acciones"
import { EditarDatosForm } from "@/components/editar-datos-form"
import { DocumentosPanel } from "@/components/documentos-panel"
import { PagosPanel } from "@/components/pagos-panel"
import { MensajesPanel } from "@/components/mensajes-panel"
import { CalificarForm } from "@/components/calificar-form"
import { StarDisplay } from "@/components/star-rating"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { LandedCostCard } from "@/components/landed-cost-card"
import { CopiarTrack } from "@/components/copiar-track"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import {
  getGestion, getEventos, getEstadosCatalogo, getDocumentos, getRequeridos,
  getLiquidaciones, getPagos, getMensajes, getCalificacion,
} from "@/lib/data/gestiones"
import { getTiposDocumento, getConceptos, getCuentas } from "@/lib/data/catalogos"
import { puede, esAgencia, PERMISOS } from "@/lib/permisos"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

const MODO_ICON = { maritimo: Ship, aereo: Plane, terrestre: Truck } as const

export default async function DetalleGestion({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la gestión." />
  const { id } = await params

  const g = await getGestion(id, usuario)
  if (!g) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Gestión no encontrada o no tienes acceso a ella.
        </div>
      </PortalShell>
    )
  }

  const [eventos, estados, documentos, requeridos, tipos, liquidaciones, pagos, cuentas, conceptos, mensajes, calificacion] =
    await Promise.all([
      getEventos(id, usuario),
      getEstadosCatalogo(),
      getDocumentos(id),
      getRequeridos(id),
      getTiposDocumento(),
      getLiquidaciones(id),
      getPagos(id),
      getCuentas(),
      getConceptos(),
      getMensajes(id),
      getCalificacion(id),
    ])
  const agencia = esAgencia(usuario.rol)
  const docsPendientes = requeridos.filter((r) => !r.cumplido).length

  const entregadaOCerrada = g.estado?.tipo === "final" || (g.estado?.nombre ?? "").includes("Entregada")
  const puedeCalificar = usuario.rol === "cliente" && entregadaOCerrada && !calificacion && puede(usuario, PERMISOS.CALIFICACION_CREAR)

  // Totales de cobros por moneda (para landed cost).
  const totalesCobros: Record<string, number> = {}
  for (const liq of liquidaciones)
    for (const l of liq.lineas ?? []) if (!l.anulada) totalesCobros[l.moneda] = (totalesCobros[l.moneda] ?? 0) + Number(l.monto)
  const backHref = usuario.rol === "cliente" ? "/panel/gestiones" : "/agencia/gestiones"
  const ModoIcon = MODO_ICON[g.modo]

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </Link>

        {/* Encabezado */}
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">{g.referencia}</h1>
                  <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
                  <DiasLibresBadge gestion={g} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {agencia && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3.5" /> {g.empresa?.nombre}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <ModoIcon className="size-3.5" /> {g.tipo_operacion}
                  </span>
                  <span>ETA {fecha(g.eta)}</span>
                  {g.referencia_cliente && <span>PO: {g.referencia_cliente}</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/reporte/${g.id}`}>
                  <Button variant="outline">Reporte PDF</Button>
                </Link>
                {agencia && <CopiarTrack token={g.public_token} />}
                {agencia && puede(usuario, PERMISOS.GESTION_EDITAR) && (
                  <Modal title="Editar datos de la carga" className="max-w-2xl" trigger={<Button variant="outline"><Pencil /> Editar datos</Button>}>
                    <EditarDatosForm g={g} />
                  </Modal>
                )}
                {agencia && (
                  <GestionAcciones
                    gestionId={g.id}
                    estados={estados}
                    esSolicitada={g.estado?.nombre === "Solicitada"}
                    puedeAceptar={puede(usuario, PERMISOS.GESTION_ACEPTAR)}
                    puedeRegistrar={puede(usuario, PERMISOS.EVENTO_REGISTRAR)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Satisfacción */}
        {puedeCalificar && (
          <div className="mt-6">
            <CalificarForm gestionId={g.id} />
          </div>
        )}
        {calificacion && (
          <Card className="mt-6">
            <CardContent className="flex flex-wrap items-center gap-3 pt-5">
              <StarDisplay value={calificacion.estrellas} size="size-5" />
              <span className="text-sm font-medium">{calificacion.estrellas}/5</span>
              {calificacion.comentario && (
                <p className="text-sm text-muted-foreground">“{calificacion.comentario}”</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pestañas */}
        <Tabs defaultValue="timeline" className="mt-6">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documentos">
              Documentos{docsPendientes > 0 ? ` (${docsPendientes})` : ""}
            </TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
            <TabsTrigger value="datos">Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Historial de eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline eventos={eventos} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentosPanel
              gestionId={g.id}
              documentos={documentos}
              requeridos={requeridos}
              tipos={tipos}
              puedeSubir={puede(usuario, PERMISOS.DOCUMENTO_SUBIR)}
              puedeRevisar={agencia && puede(usuario, PERMISOS.DOCUMENTO_REVISAR)}
              puedeRequerir={agencia && puede(usuario, PERMISOS.DOCUMENTO_REQUERIR)}
            />
          </TabsContent>

          <TabsContent value="pagos">
            <PagosPanel
              gestionId={g.id}
              liquidaciones={liquidaciones}
              pagos={pagos}
              cuentas={cuentas}
              conceptos={conceptos}
              rolCliente={usuario.rol === "cliente"}
              puedeEditar={agencia && puede(usuario, PERMISOS.LIQUIDACION_EDITAR)}
              puedeReportar={usuario.rol === "cliente" && puede(usuario, PERMISOS.PAGO_REPORTAR)}
              puedeVerificar={agencia && puede(usuario, PERMISOS.PAGO_VERIFICAR)}
            />
          </TabsContent>

          <TabsContent value="mensajes">
            <MensajesPanel gestionId={g.id} mensajes={mensajes} usuarioId={usuario.id} />
          </TabsContent>

          <TabsContent value="datos">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ficha de la carga</CardTitle>
                </CardHeader>
                <CardContent>
                  <DatosGestion g={g} />
                </CardContent>
              </Card>
              {entregadaOCerrada && (
                <LandedCostCard gestionId={g.id} unidades={g.unidades_importadas} totales={totalesCobros} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PortalShell>
  )
}
