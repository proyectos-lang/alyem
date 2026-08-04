import Link from "next/link"
import { Boxes, FileWarning, BellRing, Plus, BarChart3, Clock, ArrowRight, AlertTriangle } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EstadoChip } from "@/components/estado-chip"
import { DiasLibresBadge } from "@/components/dias-libres-badge"
import { BanerAtencion } from "@/components/baner-atencion"
import { Reveal } from "@/components/ui/reveal"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones, getEstadosCatalogo } from "@/lib/data/gestiones"
import { saludOperaciones, type OpSalud } from "@/lib/data/panel-cliente"
import { getSupabase } from "@/lib/supabase/server"
import { haceCuanto } from "@/lib/format"

export const dynamic = "force-dynamic"

const SALUD_COLOR = { verde: "#22c55e", amarillo: "#f59e0b", rojo: "#ef4444" } as const
const PESO_SALUD = { rojo: 0, amarillo: 1, verde: 2 } as const

function PuntoSalud({ salud }: { salud: OpSalud["salud"] }) {
  return (
    <span className="relative flex size-3 shrink-0">
      {salud === "rojo" && <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ backgroundColor: SALUD_COLOR.rojo }} />}
      <span className="relative inline-flex size-3 rounded-full" style={{ backgroundColor: SALUD_COLOR[salud] }} />
    </span>
  )
}

export default async function PanelCliente() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el panel." />

  const [gestiones, estados] = await Promise.all([listarGestiones(usuario), getEstadosCatalogo()])
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  const ops = usuario.empresa_id ? await saludOperaciones(usuario.empresa_id, activas, estados) : []
  ops.sort((a, b) => PESO_SALUD[a.salud] - PESO_SALUD[b.salud] || (a.libres ?? 99) - (b.libres ?? 99))

  const atencion = ops.filter((o) => o.salud !== "verde")
  const alDia = ops.filter((o) => o.salud === "verde").length
  const docsPorEnviar = ops.reduce((s, o) => s + o.docsPorEnviar, 0)

  // Actividad reciente + novedades sin leer.
  const sb = getSupabase()
  let recientes: any[] = []
  let novedades = 0
  if (usuario.empresa_id) {
    const [{ data: ev }, { count }] = await Promise.all([
      sb
        .from("eventos")
        .select("id, fecha_evento, observacion, estado:estados_catalogo(nombre, color), gestion:gestiones!inner(id, referencia, empresa_id)")
        .eq("gestion.empresa_id", usuario.empresa_id)
        .eq("interno", false)
        .order("fecha_evento", { ascending: false })
        .limit(6),
      sb.from("notificaciones").select("id", { count: "exact", head: true }).eq("usuario_id", usuario.id).eq("leida", false),
    ])
    recientes = (ev as any[]) ?? []
    novedades = count ?? 0
  }

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        {/* Banner de operaciones que requieren atención (carrusel) */}
        {atencion.length > 0 && (
          <div className="mb-4">
            <BanerAtencion
              operaciones={atencion.map((o) => ({
                id: o.g.id,
                referencia: o.g.referencia,
                estadoNombre: o.g.estado?.nombre ?? null,
                estadoColor: o.g.estado?.color ?? null,
                salud: o.salud as "amarillo" | "rojo",
                razones: o.razones,
              }))}
            />
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario.nombre.split(" ")[0]}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {atencion.length === 0
                ? "Todas tus operaciones están al día. 👍"
                : `Tienes ${atencion.length} operación(es) que requieren tu atención.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/panel/reportes"><Button variant="outline"><BarChart3 /> Reportes</Button></Link>
            <Link href="/panel/gestiones/nueva"><Button><Plus /> Nueva operación</Button></Link>
          </div>
        </div>

        {/* KPIs */}
        <Reveal className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Operaciones activas" value={activas.length} icon={Boxes} />
          <StatCard label="Requieren tu atención" value={atencion.length} icon={AlertTriangle} tone={atencion.length ? "warning" : "success"} />
          <StatCard label="Documentos por enviar" value={docsPorEnviar} icon={FileWarning} tone={docsPorEnviar ? "warning" : "default"} />
          <StatCard label="Novedades sin leer" value={novedades} icon={BellRing} tone={novedades ? "danger" : "default"} />
        </Reveal>

        {/* Requieren atención */}
        {atencion.length > 0 && (
          <Card className="mt-6 border-amber-300/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="size-4" /> Requieren tu atención
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {atencion.map((o) => (
                <Link
                  key={o.g.id}
                  href={`/g/${o.g.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <PuntoSalud salud={o.salud} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{o.g.referencia}</span>
                      <EstadoChip nombre={o.g.estado?.nombre} color={o.g.estado?.color} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {o.razones.map((r, i) => (
                        <Badge key={i} variant={r.tono === "danger" ? "danger" : "warning"}>{r.texto}</Badge>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Operaciones vigentes con semáforo + progreso */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Boxes className="size-4" /> Operaciones vigentes
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: SALUD_COLOR.verde }} /> {alDia} al día
                </span>
              </CardTitle>
              <Link href="/panel/gestiones" className="hidden sm:block">
                <Button variant="ghost" size="sm">Ver todas <ArrowRight /></Button>
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ops.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No tienes operaciones activas.</p>
              ) : (
                ops.slice(0, 8).map((o) => (
                  <Link
                    key={o.g.id}
                    href={`/g/${o.g.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <PuntoSalud salud={o.salud} />
                      <span className="min-w-0 flex-1 truncate font-medium">{o.g.referencia}</span>
                      <EstadoChip nombre={o.g.estado?.nombre} color={o.g.estado?.color} />
                    </div>
                    {/* Progreso del proceso */}
                    <div className="flex items-center gap-2 pl-[22px]">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${o.totalPasos ? (o.paso / o.totalPasos) * 100 : 0}%`, backgroundColor: o.g.estado?.color ?? "#94a3b8" }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">Paso {o.paso}/{o.totalPasos}</span>
                      <DiasLibresBadge gestion={o.g} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

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
        </div>
      </div>
    </PortalShell>
  )
}
