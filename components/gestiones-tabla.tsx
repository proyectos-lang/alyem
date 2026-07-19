import Link from "next/link"
import { Ship, Plane, Truck, Eye } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fecha, haceCuanto } from "@/lib/format"
import type { ModoTransporte } from "@/lib/types"
import type { GestionConEstado } from "@/lib/data/gestiones"

const MODO_ICON = { maritimo: Ship, aereo: Plane, terrestre: Truck } as const
const MODO_LABEL: Record<ModoTransporte, string> = {
  maritimo: "Marítimo",
  aereo: "Aéreo",
  terrestre: "Terrestre",
}

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
            <TableHead>Referencia</TableHead>
            {mostrarEmpresa && <TableHead>Empresa</TableHead>}
            <TableHead>Mercancía</TableHead>
            <TableHead>Modo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Actualizada</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gestiones.map((g) => {
            const Icon = MODO_ICON[g.modo]
            return (
              <TableRow key={g.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/g/${g.id}`} className="block font-medium text-foreground hover:text-primary">
                    {g.referencia}
                    {g.referencia_cliente && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        PO: {g.referencia_cliente}
                      </span>
                    )}
                  </Link>
                </TableCell>
                {mostrarEmpresa && (
                  <TableCell className="text-muted-foreground">{g.empresa?.nombre ?? "—"}</TableCell>
                )}
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {g.descripcion_mercancia ?? "—"}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon className="size-4" /> {MODO_LABEL[g.modo]}
                  </span>
                </TableCell>
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
                    <Button size="xs" variant="outline">
                      <Eye /> Ver operación
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
          {gestiones.length === 0 && (
            <TableRow>
              <TableCell colSpan={mostrarEmpresa ? 8 : 7} className="py-10 text-center text-muted-foreground">
                No hay gestiones que coincidan.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
