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
import { nombreEmpresa } from "@/lib/data/documentos"

export const dynamic = "force-dynamic"

export default async function DocumentosImportacion({
  params,
  searchParams,
}: {
  params: Promise<{ empresaId: string; gestionId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los documentos." />
  const { empresaId, gestionId } = await params
  const { q } = await searchParams

  const [g, nombre] = await Promise.all([getGestion(gestionId, usuario), nombreEmpresa(empresaId)])
  if (!g) {
    return (
      <PortalShell roles={["operador", "admin"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Importación no encontrada.</div>
      </PortalShell>
    )
  }

  let documentos = await getDocumentos(gestionId)
  if (q?.trim()) {
    const t = q.trim().toLowerCase()
    documentos = documentos.filter((d) => d.nombre_archivo.toLowerCase().includes(t))
  }

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <RutaCarpetas
          items={[
            { label: "Documentos", href: "/agencia/documentos" },
            { label: nombre ?? "Cliente", href: `/agencia/documentos/${empresaId}` },
            { label: g.referencia },
          ]}
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
