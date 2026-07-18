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

export const dynamic = "force-dynamic"

export default async function GestionesCliente({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver tus gestiones." />
  const { q } = await searchParams
  const gestiones = await listarGestiones(usuario, { texto: q })

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Mis gestiones"
          descripcion="Todas tus operaciones aduaneras."
          acciones={
            <Link href="/panel/gestiones/nueva">
              <Button>
                <Plus /> Nueva gestión
              </Button>
            </Link>
          }
        />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador />
          <GestionesTabla gestiones={gestiones} />
        </div>
      </div>
    </PortalShell>
  )
}
