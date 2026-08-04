import { Download, CalendarClock, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EliminarDefinicion } from "@/components/eliminar-definicion"
import { paramsDeDefinicion, type DefinicionReporte } from "@/lib/data/reportes-guardados"
import { fechaHora } from "@/lib/format"

export function ReportesGuardados({ definiciones }: { definiciones: DefinicionReporte[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4" /> Reportes guardados
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {definiciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay definiciones. Configura columnas y filtros arriba y usa “Guardar definición”.
          </p>
        ) : (
          definiciones.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {d.nombre}
                  <Badge variant="muted" className="ml-2 capitalize">{d.periodicidad}</Badge>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.cols.length} columna(s) · {d.empresa?.nombre ?? "Todos los clientes"} · rango sobre {d.base}
                </p>
                {d.ultimas && d.ultimas.length > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" /> Última: {fechaHora(d.ultimas[0].created_at)}
                    {d.ultimas[0].usuario ? ` · ${d.ultimas[0].usuario}` : ""}
                    {d.ultimas[0].filas != null ? ` · ${d.ultimas[0].filas} filas` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a href={`/api/export/reporte?${paramsDeDefinicion(d)}`} download>
                  <Button size="sm" variant="outline"><Download /> Excel</Button>
                </a>
                <EliminarDefinicion id={d.id} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
