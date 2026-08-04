import { FileText, Upload, ListChecks, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { SubirDocumentoForm } from "@/components/subir-documento-form"
import { RequeridosForm } from "@/components/requeridos-form"
import { RevisarDocumento } from "@/components/revisar-documento"
import { EliminarRequerido } from "@/components/eliminar-requerido"
import { VisorDocumento } from "@/components/visor-documento"
import { urlFirmada } from "@/lib/supabase/server"
import { fechaHora } from "@/lib/format"
import type { Documento, DocumentoRequerido, TipoDocumento } from "@/lib/types"

const ESTADO_BADGE = {
  pendiente: { variant: "warning" as const, label: "Pendiente de revisión", icon: Clock },
  aceptado: { variant: "success" as const, label: "Aceptado", icon: CheckCircle2 },
  rechazado: { variant: "danger" as const, label: "Rechazado", icon: XCircle },
}

export async function DocumentosPanel({
  gestionId,
  documentos,
  requeridos,
  tipos,
  puedeSubir,
  puedeRevisar,
  puedeRequerir,
}: {
  gestionId: string
  documentos: Documento[]
  requeridos: DocumentoRequerido[]
  tipos: TipoDocumento[]
  puedeSubir: boolean
  puedeRevisar: boolean
  puedeRequerir: boolean
}) {
  const pendientes = requeridos.filter((r) => !r.cumplido)
  // URLs firmadas temporales (bucket privado).
  const urls = new Map<string, string | null>()
  for (const d of documentos) urls.set(d.id, await urlFirmada(d.storage_path))

  // Documento entregado para cada requerido: última versión del mismo tipo.
  const docPorTipo = new Map<string, Documento>()
  for (const d of documentos) {
    if (!d.tipo_documento_id) continue
    const actual = docPorTipo.get(d.tipo_documento_id)
    if (!actual || d.version > actual.version) docPorTipo.set(d.tipo_documento_id, d)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Checklist de requeridos */}
      {(requeridos.length > 0 || puedeRequerir) && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-4" />
              Documentos requeridos
              {pendientes.length > 0 && <Badge variant="warning">{pendientes.length} pendiente(s)</Badge>}
            </CardTitle>
            {puedeRequerir && (
              <Modal title="Solicitar documentos" trigger={<Button size="sm" variant="outline">Solicitar</Button>}>
                <RequeridosForm gestionId={gestionId} tipos={tipos} />
              </Modal>
            )}
          </CardHeader>
          <CardContent>
            {requeridos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se han solicitado documentos.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {requeridos.map((r) => {
                  const entregado = docPorTipo.get(r.tipo_documento_id)
                  const urlEntregado = entregado ? urls.get(entregado.id) : null
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        {r.cumplido ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Clock className="size-4 shrink-0 text-amber-500" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium">{r.tipo?.nombre}</span>
                          {r.nota && <p className="text-xs text-muted-foreground">{r.nota}</p>}
                          {r.cumplido && entregado && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entregado.nombre_archivo}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.cumplido ? (
                          <>
                            {entregado && <VisorDocumento url={urlEntregado ?? null} nombre={entregado.nombre_archivo} />}
                            <Badge variant="success"><CheckCircle2 className="size-3" /> Entregado</Badge>
                          </>
                        ) : (
                          <>
                            {puedeSubir && (
                              <Modal title={`Subir: ${r.tipo?.nombre ?? "documento"}`} trigger={<Button size="xs"><Upload /> Subir</Button>}>
                                <SubirDocumentoForm gestionId={gestionId} tipos={tipos} tipoFijo={r.tipo_documento_id} />
                              </Modal>
                            )}
                            {puedeRequerir && <EliminarRequerido id={r.id} gestionId={gestionId} />}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Documentos
          </CardTitle>
          {puedeSubir && (
            <Modal title="Subir documento" trigger={<Button size="sm"><Upload /> Subir</Button>}>
              <SubirDocumentoForm gestionId={gestionId} tipos={tipos} />
            </Modal>
          )}
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay documentos.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {documentos.map((d) => {
                const badge = ESTADO_BADGE[d.estado]
                const url = urls.get(d.id)
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{d.nombre_archivo}</span>
                        {d.version > 1 && <Badge variant="muted">v{d.version}</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {d.tipo?.nombre ?? "Sin tipo"} · {fechaHora(d.created_at)}
                      </p>
                      {d.estado === "rechazado" && d.motivo_rechazo && (
                        <p className="mt-0.5 text-xs text-destructive">Motivo: {d.motivo_rechazo}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>
                        <badge.icon className="size-3" /> {badge.label}
                      </Badge>
                      <VisorDocumento url={url ?? null} nombre={d.nombre_archivo} />
                      {puedeRevisar && d.estado === "pendiente" && <RevisarDocumento id={d.id} />}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
