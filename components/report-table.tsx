import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { labelColumna } from "@/lib/reportes"
import { valorColumna, type FilaReporte } from "@/lib/data/reportes"

export function ReportTable({ filas, cols }: { filas: FilaReporte[]; cols: string[] }) {
  if (cols.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Selecciona columnas y presiona Generar.</p>
  }
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((c) => (
              <TableHead key={c} className="whitespace-nowrap">{labelColumna(c)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((g) => (
            <TableRow key={g.id}>
              {cols.map((c) => (
                <TableCell key={c} className="whitespace-nowrap">{valorColumna(g, c) || "—"}</TableCell>
              ))}
            </TableRow>
          ))}
          {filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={cols.length} className="py-10 text-center text-muted-foreground">
                Sin resultados para los filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
