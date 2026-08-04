import { DocumentosVista, type DocItem } from "@/components/documentos-vista"
import { urlFirmada } from "@/lib/supabase/server"
import { fechaHora } from "@/lib/format"
import type { Documento } from "@/lib/types"

// Firma las URLs en el servidor y delega el render (lista/iconos) a la vista
// cliente. Compartida por el portal del cliente y el de la agencia.
export async function DocumentosLista({ documentos }: { documentos: Documento[] }) {
  if (documentos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No hay documentos en esta importación.
      </p>
    )
  }

  const docs: DocItem[] = []
  for (const d of documentos) {
    docs.push({
      id: d.id,
      nombre: d.nombre_archivo,
      tipoLabel: d.tipo?.nombre ?? "Sin tipo",
      fecha: fechaHora(d.created_at),
      estado: d.estado,
      version: d.version,
      url: await urlFirmada(d.storage_path),
    })
  }

  return <DocumentosVista docs={docs} />
}
