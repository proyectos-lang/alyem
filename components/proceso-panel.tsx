import { Check, Circle, Pencil, ClipboardPen, FileText, CircleDot } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { PasoForm } from "@/components/paso-form"
import { PASOS, type CampoPaso } from "@/lib/pasos"
import { fecha, fechaHora } from "@/lib/format"
import type { Aduana, Documento, EstadoCatalogo, Gestion } from "@/lib/types"
import { cn } from "@/lib/utils"

// Campos que se capturan en el intake (Paso 1) pero también figuran en pasos
// posteriores. Vienen "heredados", así que no deben marcar por sí solos un paso
// posterior como diligenciado (p. ej. `descripcion_carga` en Revisión).
const CAMPOS_HEREDADOS = new Set(["descripcion_carga"])

// Un paso está "diligenciado" si al menos uno de sus campos PROPIOS ya tiene
// valor (incluye el `false` de los tristate, que es una respuesta válida).
function pasoDiligenciado(g: Gestion, campos: CampoPaso[]): boolean {
  return campos.some((c) => {
    if (CAMPOS_HEREDADOS.has(c.name)) return false
    const v = (g as Record<string, unknown>)[c.name]
    return v != null && v !== ""
  })
}

function mostrarValor(g: Gestion, c: CampoPaso): string {
  const v = (g as Record<string, unknown>)[c.name]
  if (v == null || v === "") return "—"
  if (c.tipo === "tristate") return v === true ? "Sí" : v === false ? "No" : "—"
  if (c.tipo === "date") return fecha(v as string)
  if (c.tipo === "datetime") return fechaHora(v as string)
  if (c.tipo === "aduana") return g.aduana ? `${g.aduana.nombre} (${g.aduana.codigo})` : "—"
  if (c.tipo === "select") return c.opciones?.find((o) => o.value === v)?.label ?? String(v)
  if (c.tipo === "num") return Number(v).toLocaleString("es-HN")
  return String(v)
}

export function ProcesoPanel({
  gestion,
  estados,
  documentos,
  aduanas,
  estadoActualNombre,
  puedeEditar,
}: {
  gestion: Gestion
  estados: EstadoCatalogo[]
  documentos: Documento[]
  aduanas: Aduana[]
  estadoActualNombre?: string
  puedeEditar: boolean
}) {
  const flujo = estados.filter((e) => e.tipo === "normal" || e.tipo === "final").sort((a, b) => a.orden - b.orden)
  const currentIndex = flujo.findIndex((e) => e.nombre === estadoActualNombre)

  return (
    <div className="flex flex-col gap-3">
      {PASOS.map((paso, i) => {
        const idxEnFlujo = flujo.findIndex((e) => e.nombre === paso.nombre)
        const completado = currentIndex >= 0 && idxEnFlujo >= 0 && idxEnFlujo < currentIndex
        const enCurso = idxEnFlujo === currentIndex
        const docsPaso = paso.docs
          ? documentos.filter((d) => paso.docs!.includes(d.tipo?.nombre ?? ""))
          : []
        const diligenciado = pasoDiligenciado(gestion, paso.campos)

        return (
          <Card key={paso.nombre} className={cn(enCurso && "border-primary/40 ring-1 ring-primary/20")}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5">
                    {completado ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : enCurso ? (
                      <CircleDot className="size-5 text-amber-500" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/40" />
                    )}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {i + 1}. {paso.nombre}
                      <Badge variant={paso.responsable === "cliente" ? "secondary" : "outline"}>
                        {paso.responsable === "cliente" ? "Cliente" : "Alyem"}
                      </Badge>
                      {enCurso && <Badge variant="warning">En curso</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{paso.descripcion}</p>
                  </div>
                </div>
                {puedeEditar && paso.campos.length > 0 && (
                  <Modal
                    title={paso.nombre}
                    className="max-w-2xl"
                    trigger={
                      <Button size="xs" variant={diligenciado ? "outline" : "default"}>
                        {diligenciado ? <><Pencil /> Editar</> : <><ClipboardPen /> Diligenciar</>}
                      </Button>
                    }
                  >
                    <PasoForm gestion={gestion} campos={paso.campos} aduanas={aduanas} diligenciado={diligenciado} />
                  </Modal>
                )}
              </div>

              {paso.campos.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-7 sm:grid-cols-3">
                  {paso.campos.map((c) => (
                    <div key={c.name} className="min-w-0">
                      <dt className="truncate text-[11px] text-muted-foreground">{c.label}</dt>
                      <dd className="truncate text-sm">{mostrarValor(gestion, c)}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {docsPaso.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-7">
                  {docsPaso.map((d) => (
                    <Badge key={d.id} variant="muted">
                      <FileText className="size-3" /> {d.tipo?.nombre ?? d.nombre_archivo}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
