import Link from "next/link"
import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { ordenarGestiones } from "@/lib/sort"
import { puede, PERMISOS } from "@/lib/permisos"

export const dynamic = "force-dynamic"

export default async function GestionesAgencia({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; dir?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las gestiones." />
  const { q, sort, dir } = await searchParams
  const gestiones = ordenarGestiones(await listarGestiones(usuario, { texto: q }), sort, dir)

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Gestiones"
          descripcion="Todas las operaciones de la agencia. Abre cualquiera con “Ver operación”."
          acciones={
            puede(usuario, PERMISOS.GESTION_CREAR) ? (
              <Link href="/agencia/gestiones/nueva">
                <Button>
                  <Plus /> Nueva gestión
                </Button>
              </Link>
            ) : undefined
          }
        />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador />
          <GestionesTabla gestiones={gestiones} mostrarEmpresa />
        </div>
      </div>
    </PortalShell>
  )
}
