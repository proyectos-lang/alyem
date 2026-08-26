import Link from "next/link"
import { Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EstadoChip } from "@/components/estado-chip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CeldaEditable } from "@/components/mi-espacio/celda-editable"
import { fecha } from "@/lib/format"
import type { ColumnaMiEspacio } from "@/lib/data/mi-espacio"
import type { GestionConEstado } from "@/lib/data/gestiones"

// Tabla de "Mi espacio": operaciones divididas por cliente, con columnas base
// (Referencia/Estado/ETA) + las columnas personalizadas (celdas editables).
export function TablaMiEspacio({
  grupos,
  columnas,
  valores,
  editable,
}: {
  grupos: { empresaId: string; empresa: string; items: GestionConEstado[] }[]
  columnas: ColumnaMiEspacio[]
  valores: Map<string, Record<string, unknown>>
  editable: boolean
}) {
  if (grupos.length === 0) {
    return <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No hay operaciones que mostrar.</p>
  }
  return (
    <div className="flex flex-col gap-6">
      {grupos.map((gr) => (
        <div key={gr.empresaId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <Building2 className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{gr.empresa}</h3>
            <Badge variant="muted">{gr.items.length}</Badge>
          </div>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-muted/30">Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>ETA</TableHead>
                  {columnas.map((c) => <TableHead key={c.id}>{c.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gr.items.map((g) => {
                  const vals = valores.get(g.id) ?? {}
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="sticky left-0 z-10 bg-card">
                        <Link href={`/g/${g.id}`} className="font-medium text-foreground hover:text-primary">{g.referencia}</Link>
                      </TableCell>
                      <TableCell><EstadoChip nombre={g.estado?.nombre ?? "Sin estado"} color={g.estado?.color} /></TableCell>
                      <TableCell className="text-muted-foreground">{fecha(g.eta)}</TableCell>
                      {columnas.map((c) => (
                        <TableCell key={c.id}>
                          <CeldaEditable
                            gestionId={g.id}
                            clave={c.clave}
                            tipo={c.tipo}
                            opciones={c.opciones}
                            valor={String(vals[c.clave] ?? "")}
                            editable={editable}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      ))}
    </div>
  )
}
