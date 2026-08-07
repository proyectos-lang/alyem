import Link from "next/link"
import { ArrowLeft, Pencil, Building2, Landmark, Ship, Container, CalendarClock } from "lucide-react"
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
import { MensajesPanel } from "@/components/mensajes-panel"
import { ProcesoPanel } from "@/components/proceso-panel"
import { CalificarForm } from "@/components/calificar-form"
import { StarDisplay } from "@/components/star-rating"
import { DIMENSIONES } from "@/lib/satisfaccion"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { AvanzarEtapa } from "@/components/avanzar-etapa"
import { DevolverEtapa } from "@/components/devolver-etapa"
import { MarcarRecibido } from "@/components/marcar-recibido"
import { CopiarTrack } from "@/components/copiar-track"
import { Breadcrumb } from "@/components/breadcrumb"
import { StepperTrazabilidad } from "@/components/stepper-trazabilidad"
import { StatCard } from "@/components/stat-card"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import {
  getGestion, getEventos, getEstadosCatalogo, getDocumentos, getRequeridos, getMensajes, getCalificacion,
} from "@/lib/data/gestiones"
import { getTiposDocumento } from "@/lib/data/catalogos"
import { listarAduanas } from "@/lib/data/aduanas"
import { listarRegimenes } from "@/lib/data/regimenes"
import { puede, esAgencia, PERMISOS } from "@/lib/permisos"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

const TIPO_LABEL = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" } as const

export default async function DetalleGestion({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la operación." />
  const { id } = await params

  const g = await getGestion(id, usuario)
  if (!g) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Operación no encontrada o no tienes acceso a ella.
        </div>
      </PortalShell>
    )
  }

  const [eventos, estados, documentos, requeridos, tipos, mensajes, calificacion, aduanas, regimenes] = await Promise.all([
    getEventos(id, usuario),
    getEstadosCatalogo(),
    getDocumentos(id),
    getRequeridos(id),
    getTiposDocumento(),
    getMensajes(id),
    getCalificacion(id),
    listarAduanas(true),
    listarRegimenes(),
  ])
  const agencia = esAgencia(usuario.rol)
  const docsPendientes = requeridos.filter((r) => !r.cumplido).length
  const esFinal = g.estado?.tipo === "final" || g.estado?.tipo === "cancelada"

  // ¿Se puede devolver la etapa? Solo si hay una etapa anterior en el flujo (normal/final).
  const flujoNormal = estados.filter((e) => e.tipo === "normal" || e.tipo === "final").sort((a, b) => a.orden - b.orden)
  const idxActual = flujoNormal.findIndex((e) => e.id === g.estado?.estado_id)
  const puedeDevolver = idxActual > 0

  const enCierre = (g.estado?.nombre ?? "").startsWith("Cierre") || esFinal
  const puedeConfirmar = usuario.rol === "cliente" && !g.recibido && !!g.estado &&
    (g.estado.nombre === "Facturación del servicio" || g.estado.nombre.startsWith("Cierre"))
  const puedeCalificar = usuario.rol === "cliente" && (g.recibido || enCierre) && !calificacion && puede(usuario, PERMISOS.CALIFICACION_CREAR)

  const backHref = usuario.rol === "cliente" ? "/panel/gestiones" : "/agencia/gestiones"
  const tabInicial = agencia ? "proceso" : "timeline"

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        {agencia && <Breadcrumb items={["Operaciones", TIPO_LABEL[g.tipo_operacion]]} destacado={g.referencia} />}
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </Link>

        {/* Encabezado */}
        <Card className="overflow-hidden border-border bg-gradient-to-br from-accent/40 to-card">
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
                  {g.aduana && (
                    <span className="inline-flex items-center gap-1">
                      <Landmark className="size-3.5" /> {g.aduana.nombre}
                    </span>
                  )}
                  <span>{TIPO_LABEL[g.tipo_operacion]}</span>
                  <span>ETA {fecha(g.eta)}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/reporte/${g.id}`}>
                  <Button variant="outline">Reporte PDF</Button>
                </Link>
                {agencia && <CopiarTrack token={g.public_token} />}
                {agencia && puede(usuario, PERMISOS.GESTION_EDITAR) && (
                  <Modal title="Editar datos de la operación" className="max-w-2xl" trigger={<Button variant="outline"><Pencil /> Editar</Button>}>
                    <EditarDatosForm g={g} aduanas={aduanas} regimenes={regimenes} />
                  </Modal>
                )}
                {agencia && (
                  <GestionAcciones
                    gestionId={g.id}
                    estados={estados}
                    esSolicitada={g.estado?.nombre === "Notificación del embarque"}
                    puedeAceptar={puede(usuario, PERMISOS.GESTION_ACEPTAR)}
                    puedeRegistrar={puede(usuario, PERMISOS.EVENTO_REGISTRAR)}
                  />
                )}
                {agencia && usuario.rol === "admin" && (
                  <DevolverEtapa gestionId={g.id} deshabilitado={!puedeDevolver} />
                )}
                {agencia && puede(usuario, PERMISOS.EVENTO_REGISTRAR) && (
                  <AvanzarEtapa gestionId={g.id} deshabilitado={esFinal} />
                )}
                {puedeConfirmar && <MarcarRecibido gestionId={g.id} />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas (agencia) */}
        {agencia && (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Aduana" value={g.aduana ? `${g.aduana.nombre}` : "—"} icon={Landmark} />
            <StatCard label="Naviera" value={g.naviera ?? "—"} icon={Ship} />
            <StatCard label="ETA" value={fecha(g.eta)} icon={CalendarClock} />
            <StatCard label="Contenedor" value={<span className="font-mono text-base">{g.contenedores ?? "—"}</span>} icon={Container} />
          </div>
        )}

        {/* Stepper de los 13 pasos */}
        <div className="mt-4">
          <StepperTrazabilidad estados={estados} eventos={eventos} estadoActualId={g.estado?.estado_id} />
        </div>

        {/* Satisfacción */}
        {puedeCalificar && (
          <div className="mt-6">
            <CalificarForm gestionId={g.id} />
          </div>
        )}
        {calificacion && (
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <StarDisplay value={calificacion.estrellas} size="size-5" />
                <span className="text-sm font-medium">{calificacion.estrellas}/5</span>
                {calificacion.comentario && <p className="text-sm text-muted-foreground">“{calificacion.comentario}”</p>}
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-border pt-3 sm:grid-cols-2">
                {DIMENSIONES.map((d) => {
                  const v = (calificacion as Record<string, unknown>)[d.key] as number | null
                  if (v == null) return null
                  return (
                    <div key={d.key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{d.label}</span>
                      <StarDisplay value={v} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pestañas */}
        <Tabs defaultValue={tabInicial} className="mt-6">
          <TabsList>
            {agencia && <TabsTrigger value="proceso">Proceso</TabsTrigger>}
            <TabsTrigger value="timeline">Trazabilidad</TabsTrigger>
            <TabsTrigger value="documentos">
              Documentos{docsPendientes > 0 ? ` (${docsPendientes})` : ""}
            </TabsTrigger>
            <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
            <TabsTrigger value="datos">Datos</TabsTrigger>
          </TabsList>

          {agencia && (
            <TabsContent value="proceso">
              <ProcesoPanel
                gestion={g}
                estados={estados}
                documentos={documentos}
                aduanas={aduanas}
                estadoActualNombre={g.estado?.nombre}
                puedeEditar={puede(usuario, PERMISOS.GESTION_EDITAR)}
              />
            </TabsContent>
          )}

          <TabsContent value="timeline">
            <Card>
              <CardHeader><CardTitle>Trazabilidad de la operación</CardTitle></CardHeader>
              <CardContent><Timeline eventos={eventos} /></CardContent>
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

          <TabsContent value="mensajes">
            <MensajesPanel gestionId={g.id} mensajes={mensajes} usuarioId={usuario.id} />
          </TabsContent>

          <TabsContent value="datos">
            <Card>
              <CardHeader><CardTitle>Ficha de la operación</CardTitle></CardHeader>
              <CardContent><DatosGestion g={g} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalShell>
  )
}
