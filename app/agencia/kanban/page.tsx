import Link from "next/link"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { TableroVista } from "@/components/tablero-vista"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { marcasClienteAduanero } from "@/lib/data/asignaciones"
import { ordenarGestiones } from "@/lib/sort"
import { getEstados } from "@/lib/data/catalogos"

export const dynamic = "force-dynamic"

export default async function KanbanPage({ searchParams }: { searchParams: Promise<{ vista?: string; sort?: string; dir?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el tablero." />
  const { vista, sort, dir } = await searchParams
  const esLista = vista === "lista"

  const [gestiones, estados] = await Promise.all([listarGestiones(usuario), getEstados()])
  const marcas = await marcasClienteAduanero(gestiones.map((g) => g.empresa_id))
  // Columnas: estados normales y final, en orden; se omiten pausa/cancelada.
  const columnas = estados.filter((e) => e.tipo === "normal" || e.tipo === "final")

  const porEstado = new Map<string, typeof gestiones>()
  for (const g of gestiones) {
    const key = g.estado?.estado_id ?? "sin"
    if (!porEstado.has(key)) porEstado.set(key, [])
    porEstado.get(key)!.push(g)
  }

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-full px-4 py-6 md:px-6">
        <PageHeader titulo="Tablero" descripcion="Carga de trabajo por estado, de un vistazo." acciones={<TableroVista />} />
        {esLista ? (
          <div className="mt-6">
            <GestionesTabla gestiones={ordenarGestiones(gestiones, sort, dir)} mostrarEmpresa marcas={marcas} />
          </div>
        ) : (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
          {columnas.map((col) => {
            const items = porEstado.get(col.id) ?? []
            return (
              <div key={col.id} className="flex w-72 shrink-0 flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((g) => (
                    <Link
                      key={g.id}
                      href={`/g/${g.id}`}
                      className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors hover:border-primary/40"
                    >
                      <p className="font-medium">{g.referencia}</p>
                      <p className="truncate text-xs text-muted-foreground">{g.empresa?.nombre}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{g.descripcion_carga}</p>
                      <div className="mt-2">
                        <DiasLibresBadge gestion={g} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>
    </PortalShell>
  )
}
