import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { Buscador } from "@/components/buscador"
import { RutaCarpetas } from "@/components/ruta-carpetas"
import { DocumentosLista } from "@/components/documentos-lista"
import { EstadoChip } from "@/components/estado-chip"
import { Button } from "@/components/ui/button"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getGestion, getDocumentos } from "@/lib/data/gestiones"

export const dynamic = "force-dynamic"

export default async function DocumentosImportacionCliente({
  params,
  searchParams,
}: {
  params: Promise<{ gestionId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver tus documentos." />
  const { gestionId } = await params
  const { q } = await searchParams

  // getGestion aplica el aislamiento por empresa: null si no es del cliente.
  const g = await getGestion(gestionId, usuario)
  if (!g) {
    return (
      <PortalShell roles={["cliente"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Importación no encontrada o sin acceso.
        </div>
      </PortalShell>
    )
  }

  let documentos = await getDocumentos(gestionId)
  if (q?.trim()) {
    const t = q.trim().toLowerCase()
    documentos = documentos.filter((d) => d.nombre_archivo.toLowerCase().includes(t))
  }

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <RutaCarpetas
          items={[{ label: "Documentos", href: "/panel/documentos" }, { label: g.referencia }]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{g.referencia}</h1>
            <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
          </div>
          <Link href={`/g/${g.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink /> Ver operación
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <Buscador placeholder="Buscar documento por nombre…" />
          <DocumentosLista documentos={documentos} />
        </div>
      </div>
    </PortalShell>
  )
}
