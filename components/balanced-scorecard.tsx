"use client"

import { useState } from "react"
import { ChevronDown, Workflow, Gauge, Users, FileCheck2, ShieldQuestion, Timer, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "default" | "success" | "warning" | "danger"
type Fila = { label: string; valor: React.ReactNode; contexto?: string; tone?: Tone }

export type BSCData = {
  procesos: { total: number; activas: number; cerradas: number; canceladas: number }
  eficiencia: { diasPromedioCierre: number | null; slaObjetivo: number; pctSla: number | null; cumplenSla: number; totalConCierre: number }
  cliente: { satisfaccionPromedio: number | null; calificaciones: number; calificacionesBajas: number }
  docs: { docsTotal: number; pctDocs: number | null; docsPendientes: number; docsAceptados: number }
  selectividad: { verde: number; amarillo: number; rojo: number }
  tiempos: { etapa: string; dias: number; color: string }[]
}

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-destructive",
}

interface Seccion {
  key: string
  titulo: string
  icon: LucideIcon
  marcoLabel: string
  marcoValor: React.ReactNode
  marcoTone?: Tone
  filas: Fila[]
  tiempos?: BSCData["tiempos"]
}

function construirSecciones(d: BSCData): Seccion[] {
  const promedioT = d.tiempos.length ? Math.round((d.tiempos.reduce((s, t) => s + t.dias, 0) / d.tiempos.length) * 10) / 10 : null

  return [
    {
      key: "tiempos",
      titulo: "Tiempo entre procesos",
      icon: Timer,
      marcoLabel: "Promedio general",
      marcoValor: promedioT != null ? `${promedioT} d` : "—",
      tiempos: d.tiempos,
      filas: [],
    },
    {
      key: "procesos",
      titulo: "Procesos operativos",
      icon: Workflow,
      marcoLabel: "Operaciones totales",
      marcoValor: d.procesos.total,
      filas: [
        { label: "Activas", valor: d.procesos.activas, tone: "warning" },
        { label: "Cerradas", valor: d.procesos.cerradas, tone: "success" },
        { label: "Canceladas", valor: d.procesos.canceladas, tone: d.procesos.canceladas ? "danger" : "default" },
      ],
    },
    {
      key: "eficiencia",
      titulo: "Eficiencia y tiempos",
      icon: Gauge,
      marcoLabel: "Cumplimiento de SLA",
      marcoValor: d.eficiencia.pctSla != null ? `${d.eficiencia.pctSla}%` : "—",
      marcoTone: d.eficiencia.pctSla != null ? (d.eficiencia.pctSla >= 80 ? "success" : "warning") : "default",
      filas: [
        { label: "Días promedio a cierre", valor: d.eficiencia.diasPromedioCierre ?? "—", contexto: `SLA objetivo: ${d.eficiencia.slaObjetivo} d` },
        { label: "Operaciones dentro de SLA", valor: `${d.eficiencia.cumplenSla}/${d.eficiencia.totalConCierre}`, contexto: "cerradas dentro del objetivo" },
      ],
    },
    {
      key: "cliente",
      titulo: "Cliente",
      icon: Users,
      marcoLabel: "Satisfacción promedio",
      marcoValor: d.cliente.satisfaccionPromedio != null ? `${d.cliente.satisfaccionPromedio} ★` : "—",
      filas: [
        { label: "Calificaciones recibidas", valor: d.cliente.calificaciones },
        { label: "Calificaciones bajas (≤3)", valor: d.cliente.calificacionesBajas, tone: d.cliente.calificacionesBajas ? "danger" : "success" },
      ],
    },
    {
      key: "docs",
      titulo: "Calidad documental",
      icon: FileCheck2,
      marcoLabel: "Documentos aceptados",
      marcoValor: d.docs.pctDocs != null ? `${d.docs.pctDocs}%` : "—",
      marcoTone: d.docs.pctDocs != null && d.docs.pctDocs >= 80 ? "success" : "default",
      filas: [
        { label: "Documentos totales", valor: d.docs.docsTotal },
        { label: "Aceptados", valor: d.docs.docsAceptados, tone: "success" },
        { label: "Por revisar", valor: d.docs.docsPendientes, tone: d.docs.docsPendientes ? "warning" : "default" },
      ],
    },
    {
      key: "selectividad",
      titulo: "Selectividad (canales)",
      icon: ShieldQuestion,
      marcoLabel: "Total con canal",
      marcoValor: d.selectividad.verde + d.selectividad.amarillo + d.selectividad.rojo,
      filas: [
        { label: "Verde — levante directo", valor: d.selectividad.verde, tone: "success" },
        { label: "Amarillo — espera de levante", valor: d.selectividad.amarillo, tone: "warning" },
        { label: "Rojo — inspección", valor: d.selectividad.rojo, tone: d.selectividad.rojo ? "danger" : "default" },
      ],
    },
  ]
}

export function BalancedScorecard({ data }: { data: BSCData }) {
  const secciones = construirSecciones(data)
  // Abiertas por defecto: la primera (tiempo entre procesos, indicador principal).
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set(["tiempos"]))
  const toggle = (k: string) =>
    setAbiertas((prev) => {
      const n = new Set(prev)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })

  const maxT = Math.max(1, ...data.tiempos.map((t) => t.dias))

  return (
    <div className="flex flex-col gap-3">
      {secciones.map((s) => {
        const open = abiertas.has(s.key)
        const Icon = s.icon
        return (
          <Card key={s.key} className="overflow-hidden">
            {/* Encabezado: indicador marco */}
            <button
              type="button"
              onClick={() => toggle(s.key)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                <div>
                  <p className="text-sm font-semibold">{s.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">{s.marcoLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-semibold", toneClass[s.marcoTone ?? "default"])}>{s.marcoValor}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
              </div>
            </button>

            {/* Cuerpo: tabla de micro-indicadores (se muestra siempre al imprimir) */}
            <div className={cn("border-t border-border", !open && "hidden", "print:block")}>
              {s.tiempos ? (
                <div className="flex flex-col gap-2 p-4">
                  {s.tiempos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay suficientes eventos para calcular tiempos.</p>
                  ) : (
                    s.tiempos.map((t) => (
                      <div key={t.etapa} className="flex items-center gap-3">
                        <span className="w-48 shrink-0 truncate text-sm">{t.etapa}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${(t.dias / maxT) * 100}%`, backgroundColor: t.color }} />
                        </div>
                        <span className="w-14 text-right text-sm font-semibold">{t.dias} d</span>
                      </div>
                    ))
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Cuánto tarda cada etapa antes de avanzar. Útil para detectar cuellos de botella.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Micro-indicador</th>
                      <th className="px-4 py-2 text-right font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Contexto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.filas.map((f, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-2.5">{f.label}</td>
                        <td className={cn("px-4 py-2.5 text-right font-semibold", toneClass[f.tone ?? "default"])}>{f.valor}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.contexto ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
