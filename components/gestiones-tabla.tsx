import Link from "next/link"
import { Eye } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { SortHeader } from "@/components/sort-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fecha, haceCuanto } from "@/lib/format"
import type { GestionConEstado } from "@/lib/data/gestiones"

export function GestionesTabla({
  gestiones,
  mostrarEmpresa = false,
}: {
  gestiones: GestionConEstado[]
  mostrarEmpresa?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader col="referencia">Referencia</SortHeader></TableHead>
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
            <TableRow key={g.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/g/${g.id}`} className="block font-medium text-foreground hover:text-primary">
                  {g.referencia}
                  {g.numero_factura && (
                    <span className="block text-xs font-normal text-muted-foreground">Fact: {g.numero_factura}</span>
                  )}
                </Link>
              </TableCell>
              {mostrarEmpresa && <TableCell className="text-muted-foreground">{g.empresa?.nombre ?? "—"}</TableCell>}
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
  )
}
