import { Star, TriangleAlert } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { StarDisplay } from "@/components/star-rating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

function prom(arr: number[]) {
  const v = arr.filter((n) => n != null)
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"
}

export default async function SatisfaccionPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver satisfacción." />

  const sb = getSupabase()
  const { data } = await sb
    .from("calificaciones")
    .select("*, gestion:gestiones(referencia, operador:usuarios!gestiones_operador_id_fkey(nombre)), empresa:empresas(nombre)")
    .order("created_at", { ascending: false })
  const califs = (data as any[]) ?? []

  const bajas = califs.filter((c) => c.estrellas <= 3)

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Satisfacción del cliente" descripcion="Cómo perciben el servicio, gestión por gestión." />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Promedio general" value={`${prom(califs.map((c) => c.estrellas))} ★`} icon={Star} />
          <StatCard label="Comunicación" value={prom(califs.map((c) => c.dim_comunicacion))} />
          <StatCard label="Tiempos" value={prom(califs.map((c) => c.dim_tiempos))} />
          <StatCard label="Claridad de cobros" value={prom(califs.map((c) => c.dim_cobros))} />
        </div>

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
            <CardTitle>Comentarios recientes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {califs.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay calificaciones.</p>}
            {califs.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <StarDisplay value={c.estrellas} />
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{c.gestion?.referencia}</span> · {c.empresa?.nombre}
                  </p>
                  {c.comentario && <p className="text-sm text-muted-foreground">“{c.comentario}”</p>}
                </div>
                <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{fecha(c.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
