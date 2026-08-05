import Link from "next/link"
import { TrendingDown, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fecha } from "@/lib/format"
import type { PrediccionOp } from "@/lib/data/prediccion"

// Operaciones con riesgo de retraso (predicción por tiempos históricos).
export function TorreRiesgo({ predicciones }: { predicciones: PrediccionOp[] }) {
  const enRiesgo = predicciones
    .filter((p) => p.riesgo !== "verde")
    .sort((a, b) => (a.riesgo === "rojo" ? -1 : 1) - (b.riesgo === "rojo" ? -1 : 1) || b.proyeccionDias - a.proyeccionDias)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingDown className="size-4" /> Riesgo de retraso
          {enRiesgo.length > 0 && <Badge variant="warning">{enRiesgo.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enRiesgo.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Ninguna operación en riesgo. 👍</p>
        ) : (
          <div className="flex flex-col gap-2">
            {enRiesgo.slice(0, 8).map((p) => (
              <Link
                key={p.gestionId}
                href={`/g/${p.gestionId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.riesgo === "rojo" ? "#ef4444" : "#f59e0b" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.referencia} <span className="font-normal text-muted-foreground">· {p.empresa}</span></p>
                    <p className="text-xs text-muted-foreground">{p.estado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarClock className="size-3.5" /> ~{fecha(p.finEstimado)}</span>
                  <Badge variant={p.riesgo === "rojo" ? "danger" : "warning"}>{p.riesgo === "rojo" ? "Alto" : "Medio"}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">Estimación por el tiempo promedio de cada etapa vs. el SLA del proceso.</p>
      </CardContent>
    </Card>
  )
}
