import Link from "next/link"
import { Plus, Download, UserRound, Building2 } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { FiltrosOperaciones } from "@/components/filtros-operaciones"
import { TipoOperacionTabs } from "@/components/tipo-operacion-tabs"
import { AgruparOperaciones } from "@/components/agrupar-operaciones"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones, getEstadosCatalogo } from "@/lib/data/gestiones"
import { listarAduanas } from "@/lib/data/aduanas"
import { ordenarGestiones } from "@/lib/sort"
import { filtrarGestiones } from "@/lib/filtros"
import { puede, esAgencia, PERMISOS } from "@/lib/permisos"
import { marcasClienteAduanero } from "@/lib/data/asignaciones"
import { seccionesPorOperador, seccionesPorCliente, seccionesPorOperadorCliente } from "@/lib/agrupaciones"

export const dynamic = "force-dynamic"

export default async function GestionesAgencia({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string; estado?: string; aduana?: string; canal?: string; tipo?: string; ca?: string; group?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las gestiones." />
  const { q, sort, dir, estado, aduana, canal, tipo, ca, group: groupRaw } = await searchParams
  const group = ["operador", "cliente", "operador_cliente"].includes(groupRaw ?? "") ? groupRaw : ""

  const [todas, estados, aduanas] = await Promise.all([
    listarGestiones(usuario, { texto: q }),
    getEstadosCatalogo(),
    listarAduanas(true),
  ])
  let filtradas = filtrarGestiones(todas, { estado, aduana, canal, tipo })

  // Marca diferencial de cliente aduanero: solo la ve Alyem (operador/admin).
  const marcas = esAgencia(usuario.rol)
    ? await marcasClienteAduanero(filtradas.map((g) => g.empresa_id))
    : undefined
  // Lista de clientes aduaneros presentes (para el filtro).
  const clientesAduaneros = marcas
    ? [...new Map([...marcas.values()].map((m) => [m.caId, m.caNombre])).entries()]
        .map(([id, nombre]) => ({ id, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    : []
  // Filtro por cliente aduanero: "__all__" = solo las marcadas; un id = ese cliente aduanero.
  if (marcas && ca) {
    filtradas = filtradas.filter((g) => {
      const m = marcas.get(g.empresa_id)
      return ca === "__all__" ? !!m : m?.caId === ca
    })
  }
  const gestiones = ordenarGestiones(filtradas, sort, dir)

  const exportHref = `/api/export/gestiones${q ? `?q=${encodeURIComponent(q)}` : ""}`

  return (
    <PortalShell roles={["operador", "admin", "cliente_aduanero"]}>
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
          <TipoOperacionTabs />
          <FiltrosOperaciones estados={estados} aduanas={aduanas} clientesAduaneros={clientesAduaneros} />
          <AgruparOperaciones />
          {group === "operador_cliente" ? (
            <div className="flex flex-col gap-6">
              {seccionesPorOperadorCliente(gestiones).map((op) => (
                <div key={op.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-border pb-1">
                    <UserRound className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{op.operador}</h3>
                    <Badge variant="muted">{op.total}</Badge>
                  </div>
                  {op.clientes.map((cli) => (
                    <div key={cli.id} className="flex flex-col gap-2 md:pl-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{cli.label}</span>
                        <Badge variant="muted">{cli.items.length}</Badge>
                      </div>
                      <GestionesTabla gestiones={cli.items} marcas={marcas} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : group === "operador" || group === "cliente" ? (
            <div className="flex flex-col gap-6">
              {(group === "operador" ? seccionesPorOperador(gestiones) : seccionesPorCliente(gestiones)).map((s) => (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 border-b border-border pb-1">
                    {group === "operador" ? <UserRound className="size-4 text-muted-foreground" /> : <Building2 className="size-4 text-muted-foreground" />}
                    <h3 className="text-sm font-semibold">{s.label}</h3>
                    <Badge variant="muted">{s.items.length}</Badge>
                  </div>
                  <GestionesTabla gestiones={s.items} mostrarEmpresa={group === "operador"} marcas={marcas} />
                </div>
              ))}
            </div>
          ) : (
            <GestionesTabla gestiones={gestiones} mostrarEmpresa marcas={marcas} />
          )}
        </div>
      </div>
    </PortalShell>
  )
}
