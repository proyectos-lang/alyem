import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"

export const dynamic = "force-dynamic"

export default async function GestionesAgencia({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las gestiones." />
  const { q } = await searchParams
  const gestiones = await listarGestiones(usuario, { texto: q })

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader titulo="Gestiones" descripcion="Todas las gestiones de la agencia." />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador />
          <GestionesTabla gestiones={gestiones} mostrarEmpresa />
        </div>
      </div>
    </PortalShell>
  )
}
