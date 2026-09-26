import Link from "next/link"
import { Eye, PackageMinus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fechaCorta } from "@/lib/format"
import type { DescargaCabecera } from "@/lib/types"

const num = (n: number | undefined) => (n ?? 0).toLocaleString("es-HN", { maximumFractionDigits: 3 })

const ESTADO: Record<string, { label: string; variant: "success" | "muted" | "danger" }> = {
  abierta: { label: "Abierta", variant: "success" },
  cerrada: { label: "Cerrada", variant: "muted" },
  cancelada: { label: "Cancelada", variant: "danger" },
}

function SaldoBar({ total, retirado }: { total: number; retirado: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((retirado / total) * 100)) : 0
  const saldo = total - retirado
  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium tabular-nums">{num(saldo)}</span>
        <span className="text-muted-foreground">de {num(total)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${saldo <= 0 ? "bg-destructive" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function DescargasTabla({ cabeceras }: { cabeceras: DescargaCabecera[] }) {
  if (cabeceras.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <PackageMinus className="size-8 opacity-50" />
          No hay descargas parciales registradas.
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia / BL</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cabeceras.map((c) => {
              const est = ESTADO[c.estado] ?? { label: c.estado, variant: "muted" as const }
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.referencia}
                    {c.bl && c.bl !== c.referencia && (
                      <span className="block text-xs text-muted-foreground">BL {c.bl}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.empresa?.nombre ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.producto ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <SaldoBar total={Number(c.cantidad_total)} retirado={c.retirado ?? 0} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.unidad}</TableCell>
                  <TableCell className="text-muted-foreground">{c.fecha_vencimiento ? fechaCorta(c.fecha_vencimiento) : "—"}</TableCell>
                  <TableCell><Badge variant={est.variant}>{est.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Link href={`/agencia/descargas/${c.id}`}>
                      <Button variant="ghost" size="sm"><Eye /> Ver</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
