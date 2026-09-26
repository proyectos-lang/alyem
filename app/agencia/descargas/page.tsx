import Link from "next/link"
import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Buscador } from "@/components/buscador"
import { DescargasTabla } from "@/components/descargas-tabla"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarCabeceras } from "@/lib/data/descargas"
import { puede, PERMISOS } from "@/lib/permisos"

export const dynamic = "force-dynamic"

export default async function DescargasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las descargas parciales." />
  const { q } = await searchParams

  const cabeceras = await listarCabeceras(usuario, { texto: q })

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Descargas parciales"
          descripcion="Régimen 7000 (almacén fiscal): ingresos de carga y sus retiros parciales."
          acciones={
            puede(usuario, PERMISOS.DESCARGA_CREAR) && (
              <Link href="/agencia/descargas/nueva">
                <Button><Plus /> Nueva descarga</Button>
              </Link>
            )
          }
        />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador placeholder="Buscar por referencia, BL o producto…" />
          <DescargasTabla cabeceras={cabeceras} />
        </div>
      </div>
    </PortalShell>
  )
}
