import { FileSpreadsheet, Inbox } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { labelColumna } from "@/lib/reportes"
import { valorColumna, type FilaReporte } from "@/lib/data/reportes"

export function ReportTable({ filas, cols }: { filas: FilaReporte[]; cols: string[] }) {
  if (cols.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-center">
        <FileSpreadsheet className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Selecciona columnas y presiona <span className="font-medium text-foreground">Generar</span>.</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold">Resultado</h3>
        <Badge variant="secondary">{filas.length} fila(s)</Badge>
      </div>
      <Table>
        <TableHeader className="[&_tr]:bg-muted/40">
          <TableRow>
            {cols.map((c, i) => (
              <TableHead
                key={c}
                className={
                  "whitespace-nowrap text-[11px] uppercase tracking-wide" +
                  (i === 0 ? " sticky left-0 z-10 bg-muted/40" : "")
                }
              >
                {labelColumna(c)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((g) => (
            <TableRow key={g.id} className="group">
              {cols.map((c, i) => (
                <TableCell
                  key={c}
                  className={
                    "whitespace-nowrap" +
                    (i === 0 ? " sticky left-0 z-10 bg-card font-medium group-hover:bg-muted/50" : "")
                  }
                >
                  {valorColumna(g, c) || <span className="text-muted-foreground">—</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={cols.length} className="py-12 text-center text-muted-foreground">
                <Inbox className="mx-auto mb-1.5 size-7 text-muted-foreground/50" />
                Sin resultados para los filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
