import { UserRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GrupoOperador } from "@/lib/agrupaciones"

// Resumen anidado operador → cliente con subtotales. Colapsable con <details>
// nativo (sin JS). Se usa en la Torre de control.
export function ResumenOperadorCliente({ grupos }: { grupos: GrupoOperador[] }) {
  if (grupos.length === 0) {
    return <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No hay operaciones.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {grupos.map((op) => (
        <Card key={op.operadorId ?? "sin"} className="overflow-hidden">
          <details open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 hover:bg-muted/40">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="size-4 text-muted-foreground" /> {op.operador}
                <Badge variant="muted">{op.clientes.length} cliente{op.clientes.length === 1 ? "" : "s"}</Badge>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{op.total} ops</span>
                <span className="text-emerald-600 dark:text-emerald-400">{op.activas} activas</span>
                <span>{op.cerradas} cerradas</span>
              </span>
            </summary>
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Operaciones</TableHead>
                    <TableHead className="text-right">Activas</TableHead>
                    <TableHead className="text-right">Cerradas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {op.clientes.map((c) => (
                    <TableRow key={c.empresaId}>
                      <TableCell className="font-medium">{c.empresa}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.total}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{c.activas}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.cerradas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        </Card>
      ))}
    </div>
  )
}
