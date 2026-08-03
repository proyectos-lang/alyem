import Link from "next/link"
import { Boxes, FileWarning, CheckCircle2, Bell, Plus, BarChart3, Clock, ArrowRight, Timer } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Buscador } from "@/components/buscador"
import { GestionesTabla } from "@/components/gestiones-tabla"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getSupabase } from "@/lib/supabase/server"
import { diasLibresRestantes } from "@/lib/data/metricas"
import { haceCuanto } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function PanelCliente({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el panel." />
  const { q } = await searchParams

  const gestiones = await listarGestiones(usuario, { texto: q })
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const cerradas = gestiones.filter((g) => g.estado?.tipo === "final")

  // Distribución por etapa (activas).
  const porEtapa = new Map<string, { n: number; color: string }>()
  for (const g of activas) {
    const nom = g.estado?.nombre ?? "Sin estado"
    const cur = porEtapa.get(nom) ?? { n: 0, color: g.estado?.color ?? "#94a3b8" }
    cur.n++
    porEtapa.set(nom, cur)
  }
  const maxEtapa = Math.max(1, ...[...porEtapa.values()].map((v) => v.n))

  // Días libres por vencer.
  const porVencer = activas
    .map((g) => ({ g, d: diasLibresRestantes(g) }))
    .filter((x) => x.d != null && x.d <= 3)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))

  const sb = getSupabase()
  let docsPendientes = 0
  const recientes: any[] = []
  if (usuario.empresa_id) {
    const [{ count }, { data: ev }, { count: novedades }] = await Promise.all([
      sb
        .from("documentos_requeridos")
        .select("id, gestion:gestiones!inner(empresa_id)", { count: "exact", head: true })
        .eq("cumplido", false)
        .eq("gestion.empresa_id", usuario.empresa_id),
      sb
        .from("eventos")
        .select("id, fecha_evento, observacion, estado:estados_catalogo(nombre, color), gestion:gestiones!inner(id, referencia, empresa_id)")
        .eq("gestion.empresa_id", usuario.empresa_id)
        .eq("interno", false)
        .order("fecha_evento", { ascending: false })
        .limit(6),
      sb.from("notificaciones").select("id", { count: "exact", head: true }).eq("usuario_id", usuario.id).eq("leida", false),
    ])
    docsPendientes = count ?? 0
    recientes.push(...((ev as any[]) ?? []))
    ;(recientes as any).novedades = novedades ?? 0
  }
  const novedades = (recientes as any).novedades ?? 0

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario.nombre.split(" ")[0]}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{usuario.empresa?.nombre ?? "Tus operaciones aduaneras"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/panel/reportes"><Button variant="outline"><BarChart3 /> Reportes</Button></Link>
            <Link href="/panel/gestiones/nueva"><Button><Plus /> Nueva operación</Button></Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Operaciones activas" value={activas.length} icon={Boxes} />
          <StatCard label="Documentos pendientes" value={docsPendientes} icon={FileWarning} tone={docsPendientes ? "warning" : "default"} />
          <StatCard label="Cerradas" value={cerradas.length} icon={CheckCircle2} tone="success" />
          <StatCard label="Novedades sin leer" value={novedades} icon={Bell} tone={novedades ? "danger" : "default"} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Actividad reciente */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-4" /> Actividad reciente</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recientes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin novedades todavía.</p>
              ) : (
                recientes.map((e) => (
                  <Link key={e.id} href={`/g/${e.gestion?.id}`} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.estado?.color ?? "#94a3b8" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{e.gestion?.referencia}</span>
                        {e.estado?.nombre && <span className="text-muted-foreground"> · {e.estado.nombre}</span>}
                      </p>
                      {e.observacion && <p className="truncate text-xs text-muted-foreground">{e.observacion}</p>}
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">{haceCuanto(e.fecha_evento)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Por etapa + días libres */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader><CardTitle>Operaciones por etapa</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                {porEtapa.size === 0 && <p className="text-sm text-muted-foreground">Sin operaciones activas.</p>}
                {[...porEtapa.entries()].map(([nom, v]) => (
                  <div key={nom} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 truncate text-xs">{nom}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(v.n / maxEtapa) * 100}%`, backgroundColor: v.color }} />
                    </div>
                    <span className="w-6 text-right text-xs font-medium">{v.n}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {porVencer.length > 0 && (
              <Card className="border-amber-300/60">
                <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700"><Timer className="size-4" /> Días libres por vencer</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-1.5">
                  {porVencer.map(({ g, d }) => (
                    <Link key={g.id} href={`/g/${g.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
                      <span className="font-medium">{g.referencia}</span>
                      <Badge variant={d != null && d < 0 ? "danger" : "warning"}>{d != null && d < 0 ? "Vencidos" : `Quedan ${d}d`}</Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Operaciones */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Mis operaciones</h2>
            <div className="flex items-center gap-2">
              <Buscador />
              <Link href="/panel/gestiones" className="hidden sm:block">
                <Button variant="ghost" size="sm">Ver todas <ArrowRight /></Button>
              </Link>
            </div>
          </div>
          <GestionesTabla gestiones={gestiones.slice(0, 8)} />
        </div>
      </div>
    </PortalShell>
  )
}
