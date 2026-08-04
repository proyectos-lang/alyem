import { Star, TriangleAlert, Radar as RadarIcon } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { StarDisplay } from "@/components/star-rating"
import { RadarSatisfaccion } from "@/components/radar-satisfaccion"
import { DetalleCalificacion } from "@/components/detalle-calificacion"
import { Reveal } from "@/components/ui/reveal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarCalificaciones, promediosDimensiones } from "@/lib/data/satisfaccion"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

function prom(arr: number[]) {
  const v = arr.filter((n) => n != null)
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"
}

export default async function SatisfaccionPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver satisfacción." />

  const califs = await listarCalificaciones()
  const radar = promediosDimensiones(califs)
  const bajas = califs.filter((c) => c.estrellas <= 3)

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Satisfacción del cliente" descripcion="Cómo perciben el servicio, gestión por gestión." />

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Promedio general" value={`${prom(califs.map((c) => c.estrellas))} ★`} icon={Star} />
          <StatCard label="Evaluaciones" value={califs.length} />
          <StatCard label="Bajas (≤3★)" value={bajas.length} tone={bajas.length ? "danger" : "success"} />
          <StatCard label="Dimensiones evaluadas" value={radar.filter((d) => d.n > 0).length} />
        </div>

        {/* Radar de satisfacción por dimensión */}
        <Reveal className="mt-6 block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadarIcon className="size-4" /> Promedio por dimensión
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
            {califs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay calificaciones.</p>
            ) : (
              <RadarSatisfaccion datos={radar} />
            )}
            <div className="flex flex-col justify-center gap-1.5">
              {radar.map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-semibold">{d.n ? `${d.promedio} ★` : "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </Reveal>

        {bajas.length > 0 && (
          <Card className="mt-6 border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TriangleAlert className="size-4" /> Calificaciones bajas por atender ({bajas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {bajas.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarDisplay value={c.estrellas} />
                    <span className="text-sm font-medium">{c.gestion?.referencia}</span>
                    <Badge variant="muted">{c.empresa?.nombre}</Badge>
                    {c.gestion?.operador?.nombre && (
                      <span className="text-xs text-muted-foreground">Operador: {c.gestion.operador.nombre}</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">{fecha(c.created_at)}</span>
                  </div>
                  {c.comentario && <p className="mt-1.5 text-sm text-muted-foreground">“{c.comentario}”</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Todas las evaluaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {califs.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay calificaciones.</p>}
            {califs.map((c) => (
              <DetalleCalificacion key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
