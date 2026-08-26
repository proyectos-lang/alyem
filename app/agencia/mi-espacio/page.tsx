import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { SetupNotice } from "@/components/setup-notice"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Columns3 } from "lucide-react"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { columnasDe, valoresDe, operadoresActivos, usuarioBasico } from "@/lib/data/mi-espacio"
import { seccionesPorCliente } from "@/lib/agrupaciones"
import { TablaMiEspacio } from "@/components/mi-espacio/tabla-mi-espacio"
import { ColumnasEditor } from "@/components/mi-espacio/columnas-editor"
import { SelectorCoordinador } from "@/components/mi-espacio/selector-coordinador"

export const dynamic = "force-dynamic"

// Tabla de control personal por coordinador, dividida por cliente. Cada fila es
// una operación; las columnas las define cada coordinador. El admin puede ver el
// espacio de un coordinador (solo lectura).
export default async function MiEspacioPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver Mi espacio." />
  const { u } = await searchParams

  const esAdmin = usuario.rol === "admin"
  let target = { id: usuario.id, rol: usuario.rol, empresa_id: usuario.empresa_id, nombre: usuario.nombre }
  if (esAdmin && u && u !== usuario.id) {
    const t = await usuarioBasico(u)
    if (t) target = t
  }
  const esPropio = target.id === usuario.id

  const [columnas, operaciones, coordinadores] = await Promise.all([
    columnasDe(target.id),
    listarGestiones({ id: target.id, rol: target.rol, empresa_id: target.empresa_id }),
    esAdmin ? operadoresActivos() : Promise.resolve([]),
  ])
  const valores = await valoresDe(target.id, operaciones.map((o) => o.id))
  const grupos = seccionesPorCliente(operaciones).map((s) => ({ empresaId: s.id, empresa: s.label, items: s.items }))

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Mi espacio"
          descripcion="Tu tabla de control por cliente, con las columnas que tú definas."
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              {esAdmin && <SelectorCoordinador coordinadores={coordinadores} actual={u ?? ""} yo={usuario.id} />}
              {esPropio && (
                <Modal title="Columnas de Mi espacio" trigger={<Button variant="outline"><Columns3 /> Columnas</Button>}>
                  <ColumnasEditor columnas={columnas} />
                </Modal>
              )}
            </div>
          }
        />
        {!esPropio && (
          <p className="mt-2 text-xs text-muted-foreground">Viendo el espacio de <b>{target.nombre}</b> (solo lectura).</p>
        )}
        {esPropio && columnas.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Aún no tienes columnas propias. Agrégalas con “Columnas” para llevar tu control (son opcionales y solo tuyas).
          </p>
        )}
        <div className="mt-6">
          <TablaMiEspacio grupos={grupos} columnas={columnas} valores={valores} editable={esPropio} />
        </div>
      </div>
    </PortalShell>
  )
}
