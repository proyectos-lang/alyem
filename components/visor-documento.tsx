"use client"

import { Eye, Download, FileText } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

// Previsualiza un documento dentro de la app (modal), sin abrir otra pestaña.
// PDF -> iframe; imágenes -> <img>; otros formatos -> aviso + descarga.
function tipoArchivo(nombre: string): "pdf" | "imagen" | "otro" {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "imagen"
  return "otro"
}

// Fuerza la descarga con el nombre original (Supabase respeta ?download=).
function urlDescarga(url: string, nombre: string): string {
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}download=${encodeURIComponent(nombre)}`
}

export function VisorDocumento({
  url,
  nombre,
  label,
  trigger: triggerProp,
}: {
  url: string | null
  nombre: string
  label?: string
  trigger?: React.ReactNode
}) {
  const tipo = tipoArchivo(nombre)

  const trigger =
    triggerProp ??
    (label ? (
      <Button size="xs" variant="outline">
        <Eye /> {label}
      </Button>
    ) : (
      <button
        type="button"
        title="Previsualizar"
        aria-label="Previsualizar documento"
        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Eye className="size-4" />
      </button>
    ))

  return (
    <Modal title={nombre} className="max-w-5xl" trigger={trigger}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          {url && (
            <a href={urlDescarga(url, nombre)}>
              <Button size="sm" variant="outline">
                <Download /> Descargar
              </Button>
            </a>
          )}
        </div>

        {!url ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No se pudo cargar el documento. Intenta actualizar la página.
          </p>
        ) : tipo === "pdf" ? (
          <iframe src={url} title={nombre} className="h-[72vh] w-full rounded-lg border border-border bg-white" />
        ) : tipo === "imagen" ? (
          <div className="flex max-h-[72vh] justify-center overflow-auto rounded-lg border border-border bg-muted/30 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={nombre} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Este tipo de archivo no se puede previsualizar aquí. Descárgalo para verlo.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
