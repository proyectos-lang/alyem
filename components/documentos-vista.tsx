"use client"

import { useEffect, useState } from "react"
import { FileText, Download, Eye, List, LayoutGrid, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VisorDocumento } from "@/components/visor-documento"
import { cn } from "@/lib/utils"

export type DocItem = {
  id: string
  nombre: string
  tipoLabel: string
  fecha: string
  estado: "pendiente" | "aceptado" | "rechazado"
  version: number
  url: string | null
}

const ESTADO_BADGE = {
  pendiente: { variant: "warning" as const, label: "Pendiente", icon: Clock },
  aceptado: { variant: "success" as const, label: "Aceptado", icon: CheckCircle2 },
  rechazado: { variant: "danger" as const, label: "Rechazado", icon: XCircle },
}

function tipoArchivo(nombre: string): "pdf" | "imagen" | "otro" {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "imagen"
  return "otro"
}

function urlDescarga(url: string, nombre: string): string {
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}download=${encodeURIComponent(nombre)}`
}

// Miniatura con previsualización real (imagen o PDF embebido).
function Miniatura({ d }: { d: DocItem }) {
  const tipo = tipoArchivo(d.nombre)
  return (
    <div className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-muted/40">
      {d.url && tipo === "imagen" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.url} alt={d.nombre} className="h-full w-full object-cover" />
      ) : d.url && tipo === "pdf" ? (
        <iframe
          src={`${d.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title={d.nombre}
          className="pointer-events-none h-full w-full border-0 bg-white"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <FileText className="size-10 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition group-hover:bg-foreground/10 group-hover:opacity-100">
        <span className="flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-xs font-medium shadow">
          <Eye className="size-3.5" /> Ver
        </span>
      </div>
    </div>
  )
}

export function DocumentosVista({ docs }: { docs: DocItem[] }) {
  const [vista, setVista] = useState<"lista" | "iconos">("lista")

  useEffect(() => {
    const v = localStorage.getItem("alyem:docs:vista")
    if (v === "iconos" || v === "lista") setVista(v)
  }, [])

  const cambiar = (v: "lista" | "iconos") => {
    setVista(v)
    try {
      localStorage.setItem("alyem:docs:vista", v)
    } catch {
      /* sin persistencia */
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Conmutador de vista */}
      <div className="flex items-center justify-end gap-1">
        <Button size="icon-sm" variant={vista === "lista" ? "default" : "outline"} onClick={() => cambiar("lista")} title="Vista de lista">
          <List />
        </Button>
        <Button size="icon-sm" variant={vista === "iconos" ? "default" : "outline"} onClick={() => cambiar("iconos")} title="Vista de iconos">
          <LayoutGrid />
        </Button>
      </div>

      {vista === "iconos" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {docs.map((d) => {
            const badge = ESTADO_BADGE[d.estado]
            return (
              <div key={d.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <VisorDocumento url={d.url} nombre={d.nombre} trigger={<div><Miniatura d={d} /></div>} />
                <div className="flex flex-col gap-2 p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={d.nombre}>{d.nombre}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {d.tipoLabel} · {d.fecha}{d.version > 1 ? ` · v${d.version}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={badge.variant}><badge.icon className="size-3" /> {badge.label}</Badge>
                    {d.url && (
                      <a href={urlDescarga(d.url, d.nombre)} title="Descargar">
                        <Button size="icon-sm" variant="outline"><Download /></Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => {
            const badge = ESTADO_BADGE[d.estado]
            return (
              <li key={d.id} className={cn("flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3")}>
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.tipoLabel} · {d.fecha}{d.version > 1 ? ` · v${d.version}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant}><badge.icon className="size-3" /> {badge.label}</Badge>
                  <VisorDocumento url={d.url} nombre={d.nombre} />
                  {d.url && (
                    <a href={urlDescarga(d.url, d.nombre)} title="Descargar">
                      <Button size="icon-sm" variant="outline"><Download /></Button>
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
