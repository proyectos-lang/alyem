import Link from "next/link"
import { Plus, Download } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { FiltrosOperaciones } from "@/components/filtros-operaciones"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones, getEstadosCatalogo } from "@/lib/data/gestiones"
import { listarAduanas } from "@/lib/data/aduanas"
import { ordenarGestiones } from "@/lib/sort"
import { filtrarGestiones } from "@/lib/filtros"
import { puede, PERMISOS } from "@/lib/permisos"

export const dynamic = "force-dynamic"

export default async function GestionesAgencia({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string; estado?: string; aduana?: string; canal?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las gestiones." />
  const { q, sort, dir, estado, aduana, canal } = await searchParams

  const [todas, estados, aduanas] = await Promise.all([
    listarGestiones(usuario, { texto: q }),
    getEstadosCatalogo(),
    listarAduanas(true),
  ])
  const filtradas = filtrarGestiones(todas, { estado, aduana, canal })
  const gestiones = ordenarGestiones(filtradas, sort, dir)

  const exportHref = `/api/export/gestiones${q ? `?q=${encodeURIComponent(q)}` : ""}`

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Gestiones"
          descripcion="Todas las operaciones de la agencia. Abre cualquiera con “Ver operación”."
          acciones={
            <div className="flex items-center gap-2">
              <a href={exportHref}>
                <Button variant="outline"><Download /> Excel</Button>
              </a>
              {puede(usuario, PERMISOS.GESTION_CREAR) && (
                <Link href="/agencia/gestiones/nueva">
                  <Button>
                    <Plus /> Nueva gestión
                  </Button>
                </Link>
              )}
            </div>
          }
        />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador />
          <FiltrosOperaciones estados={estados} aduanas={aduanas} />
          <GestionesTabla gestiones={gestiones} mostrarEmpresa />
        </div>
      </div>
    </PortalShell>
  )
}
