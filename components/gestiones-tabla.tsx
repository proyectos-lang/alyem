import Link from "next/link"
import { Eye, Briefcase } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { SortHeader } from "@/components/sort-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fecha, haceCuanto } from "@/lib/format"
import type { GestionConEstado } from "@/lib/data/gestiones"

// Insignia de marca diferencial: identifica a Alyem que la operación pertenece a
// un cliente aduanero (sub-agencia). Solo se muestra en las vistas de Alyem.
function MarcaCA({ nombre }: { nombre: string }) {
  return (
    <span
      className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
      title={`Cliente aduanero: ${nombre}`}
    >
      <Briefcase className="size-3 shrink-0" />
      <span className="truncate">{nombre}</span>
    </span>
  )
}

export function GestionesTabla({
  gestiones,
  mostrarEmpresa = false,
  marcas,
}: {
  gestiones: GestionConEstado[]
  mostrarEmpresa?: boolean
  marcas?: Map<string, { caId: string; caNombre: string }>
}) {
  const marcaDe = (empresaId: string) => marcas?.get(empresaId)
  return (
    <>
      {/* Vista móvil: tarjetas */}
      <div className="flex flex-col gap-2 md:hidden">
        {gestiones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No hay operaciones que coincidan.
          </p>
        ) : (
          gestiones.map((g) => (
            <Link
              key={g.id}
              href={`/g/${g.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 active:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.referencia}</p>
                  {mostrarEmpresa && <p className="truncate text-xs text-muted-foreground">{g.empresa?.nombre ?? "—"}</p>}
                  {mostrarEmpresa && marcaDe(g.empresa_id) && (
                    <span className="mt-1 inline-flex"><MarcaCA nombre={marcaDe(g.empresa_id)!.caNombre} /></span>
                  )}
                </div>
                <EstadoChip nombre={g.estado?.nombre ?? "Sin estado"} color={g.estado?.color} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {g.aduana?.nombre && <span>{g.aduana.nombre}</span>}
                {g.naviera && <span>· {g.naviera}</span>}
                <span>· ETA {fecha(g.eta)}</span>
              </div>
              <DiasLibresBadge gestion={g} />
            </Link>
          ))
        )}
      </div>

      {/* Vista escritorio: tabla */}
      <Card className="hidden overflow-hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-muted/30"><SortHeader col="referencia">Referencia</SortHeader></TableHead>
            {mostrarEmpresa && <TableHead><SortHeader col="empresa">Empresa</SortHeader></TableHead>}
            <TableHead><SortHeader col="aduana">Aduana</SortHeader></TableHead>
            <TableHead><SortHeader col="naviera">Naviera</SortHeader></TableHead>
            <TableHead><SortHeader col="estado">Estado</SortHeader></TableHead>
            <TableHead><SortHeader col="eta">ETA</SortHeader></TableHead>
            <TableHead><SortHeader col="actualizada">Actualizada</SortHeader></TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gestiones.map((g) => (
            <TableRow key={g.id} className="group cursor-pointer">
              <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-muted/50">
                <Link href={`/g/${g.id}`} className="block font-medium text-foreground hover:text-primary">
                  {g.referencia}
                  {g.numero_factura && (
                    <span className="block text-xs font-normal text-muted-foreground">Fact: {g.numero_factura}</span>
                  )}
                </Link>
              </TableCell>
              {mostrarEmpresa && (
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-col items-start gap-1">
                    <span>{g.empresa?.nombre ?? "—"}</span>
                    {marcaDe(g.empresa_id) && <MarcaCA nombre={marcaDe(g.empresa_id)!.caNombre} />}
                  </div>
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{g.aduana?.nombre ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{g.naviera ?? "—"}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <EstadoChip nombre={g.estado?.nombre ?? "Sin estado"} color={g.estado?.color} />
                  <DiasLibresBadge gestion={g} />
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{fecha(g.eta)}</TableCell>
              <TableCell className="text-muted-foreground">{haceCuanto(g.estado?.fecha ?? g.created_at)}</TableCell>
              <TableCell className="text-right">
                <Link href={`/g/${g.id}`}>
                  <Button size="xs" variant="outline"><Eye /> Ver operación</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {gestiones.length === 0 && (
            <TableRow>
              <TableCell colSpan={mostrarEmpresa ? 8 : 7} className="py-10 text-center text-muted-foreground">
                No hay operaciones que coincidan.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </Card>
    </>
  )
}
