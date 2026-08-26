import Link from "next/link"
import { TriangleAlert, Timer, Boxes, ShieldAlert } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EstadoChip } from "@/components/estado-chip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Buscador } from "@/components/buscador"
import { TorreTendencias } from "@/components/torre-tendencias"
import { TorreEtas } from "@/components/torre-etas"
import { TorreRiesgo } from "@/components/torre-riesgo"
import { BanerAtencion } from "@/components/baner-atencion"
import { ResumenOperadorCliente } from "@/components/resumen-operador-cliente"
import { agruparPorOperadorCliente } from "@/lib/agrupaciones"
import { Reveal } from "@/components/ui/reveal"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones, getEstadosCatalogo } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { diasEnEtapa, diasTotales, diasLibresRestantes, alertasDe, tendenciasTorre } from "@/lib/data/metricas"
import { predecirRetrasos } from "@/lib/data/prediccion"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const CANAL_COLOR = { verde: "#22c55e", amarillo: "#eab308", rojo: "#ef4444" } as const
const DIA = 86_400_000

type Ver = "alertas" | "rojo" | "libres" | undefined

export default async function TorreControl({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la torre de control." />
  const { q, ver: verRaw } = await searchParams
  const ver = (["alertas", "rojo", "libres"].includes(verRaw ?? "") ? verRaw : undefined) as Ver

  const [gestiones, diasFriaStr, slaStr, estados, tendencias] = await Promise.all([
    listarGestiones(usuario, { texto: q }),
    getConfig("dias_gestion_fria"),
    getConfig("sla_dias_proceso"),
    getEstadosCatalogo(),
    tendenciasTorre(),
  ])
  const diasFria = Number(diasFriaStr ?? "4")
  const predicciones = predecirRetrasos(gestiones, estados, tendencias.etapas.map((e) => ({ etapa: e.etapa, orden: 0, color: e.color, dias: e.dias, n: 0 })), Number(slaStr ?? "15"))
  const slaPorEstado = new Map(estados.map((e) => [e.nombre, e.sla_dias ?? null]))

  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const filas = activas
    .map((g) => ({
      g,
      alertas: alertasDe(g, diasFria, g.estado?.nombre ? slaPorEstado.get(g.estado.nombre) : null),
      enEtapa: diasEnEtapa(g),
      total: diasTotales(g),
      libres: diasLibresRestantes(g),
    }))
    .sort((a, b) => b.alertas.length - a.alertas.length || (b.enEtapa ?? 0) - (a.enEtapa ?? 0))

  const conAlertas = filas.filter((f) => f.alertas.length > 0).length
  const canalRojo = activas.filter((g) => g.canal_selectivo === "rojo").length
  const libresPorVencer = filas.filter((f) => f.libres != null && f.libres <= 3).length

  // Banner de atención (carrusel).
  const atencion = filas
    .filter((f) => f.alertas.length > 0)
    .map((f) => ({
      id: f.g.id,
      referencia: f.g.referencia,
      empresa: f.g.empresa?.nombre ?? null,
      estadoNombre: f.g.estado?.nombre ?? null,
      estadoColor: f.g.estado?.color ?? null,
      salud: (f.alertas.some((a) => a.severidad === "danger") ? "rojo" : "amarillo") as "amarillo" | "rojo",
      razones: f.alertas.map((a) => ({ texto: a.etiqueta, tono: a.severidad === "danger" ? ("danger" as const) : ("warning" as const) })),
    }))

  // Próximos arribos por ETA.
  const arribos = activas
    .filter((g) => g.eta)
    .map((g) => ({
      id: g.id,
      referencia: g.referencia,
      empresa: g.empresa?.nombre ?? null,
      eta: g.eta as string,
      dias: Math.ceil((new Date(g.eta as string).getTime() - Date.now()) / DIA),
    }))
    .filter((a) => a.dias >= -3 && a.dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 12)

  // Filtro de la tabla según la tarjeta seleccionada.
  const filtradas =
    ver === "alertas"
      ? filas.filter((f) => f.alertas.length > 0)
      : ver === "rojo"
        ? filas.filter((f) => f.g.canal_selectivo === "rojo")
        : ver === "libres"
          ? filas.filter((f) => f.libres != null && f.libres <= 3)
          : filas

  const torreHref = (v: Ver) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (v) p.set("ver", v)
    const qs = p.toString()
    return `/agencia/torre${qs ? `?${qs}` : ""}#operaciones`
  }
  // Serie mensual de creadas para el sparkline del KPI de activas.
  const serieActivas = tendencias.meses.map((m) => m.creadas)
  const ETIQUETA_FILTRO: Record<string, string> = { alertas: "con alertas", rojo: "en canal rojo", libres: "con días libres por vencer" }
  const tituloFiltro = ver ? ETIQUETA_FILTRO[ver] : ""

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Torre de control"
          descripcion="Vista integral de todas las operaciones activas, sus tiempos y alertas."
        />

        {/* Banner de operaciones que requieren atención */}
        {atencion.length > 0 && (
          <div className="mt-6">
            <BanerAtencion operaciones={atencion} />
          </div>
        )}

        {/* KPIs interactivos: al hacer clic filtran la tabla y saltan a ella */}
        <Reveal className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Operaciones activas" value={activas.length} icon={Boxes} href={torreHref(undefined)} active={!ver} spark={serieActivas} hint="Clic para ver todas" />
          <StatCard label="Con alertas" value={conAlertas} icon={TriangleAlert} tone={conAlertas ? "warning" : "default"} href={torreHref("alertas")} active={ver === "alertas"} proporcion={{ valor: conAlertas, total: activas.length }} hint="Clic para procesarlas" />
          <StatCard label="Canal rojo" value={canalRojo} icon={ShieldAlert} tone={canalRojo ? "danger" : "default"} href={torreHref("rojo")} active={ver === "rojo"} proporcion={{ valor: canalRojo, total: activas.length }} hint="Clic para procesarlas" />
          <StatCard label="Días libres por vencer" value={libresPorVencer} icon={Timer} tone={libresPorVencer ? "warning" : "default"} href={torreHref("libres")} active={ver === "libres"} proporcion={{ valor: libresPorVencer, total: activas.length }} hint="Clic para procesarlas" />
        </Reveal>

        {/* Operaciones (con filtro por KPI) — justo debajo para que el clic sea visible */}
        <div id="operaciones" className="mt-6 flex scroll-mt-20 flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {ver ? "Operaciones" : "Operaciones en curso"}
            {ver && (
              <>
                <Badge variant="warning">{tituloFiltro}</Badge>
                <Link href={torreHref(undefined)} className="text-xs font-normal text-primary hover:underline">Quitar filtro</Link>
              </>
            )}
          </h2>
          <Buscador />
        </div>

        {/* Vista móvil: tarjetas */}
        <div className="mt-3 flex flex-col gap-2 md:hidden">
          {filtradas.length === 0 && (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {ver ? "No hay operaciones que coincidan con el filtro." : "No hay operaciones activas."}
            </p>
          )}
          {filtradas.map(({ g, alertas, enEtapa, total, libres }) => (
            <Link
              key={g.id}
              href={`/g/${g.id}`}
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 active:bg-muted/50",
                alertas.some((a) => a.severidad === "danger") && "border-destructive/40 bg-destructive/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.referencia}</p>
                  <p className="truncate text-xs text-muted-foreground">{g.empresa?.nombre ?? "—"}</p>
                </div>
                <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>En etapa: <b className={cn(enEtapa != null && enEtapa >= diasFria && "text-amber-600")}>{enEtapa ?? "—"}d</b></span>
                <span>Total: {total}d</span>
                <span className={cn(libres != null && libres <= 3 && "text-amber-600", libres != null && libres < 0 && "text-destructive")}>
                  Libres: {libres ?? "—"}{libres != null ? "d" : ""}
                </span>
                {g.canal_selectivo && (
                  <span className="inline-flex items-center gap-1 capitalize">
                    <span className="size-2 rounded-full" style={{ backgroundColor: CANAL_COLOR[g.canal_selectivo] }} />
                    {g.canal_selectivo}
                  </span>
                )}
              </div>
              {alertas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alertas.map((a, i) => (
                    <Badge key={i} variant={a.severidad === "danger" ? "danger" : "warning"}>{a.etiqueta}</Badge>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Vista escritorio: tabla */}
        <Card className="mt-3 hidden overflow-hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-muted/30">Referencia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa actual</TableHead>
                <TableHead className="text-right">Días en etapa</TableHead>
                <TableHead className="text-right">Días totales</TableHead>
                <TableHead className="text-right">Días libres</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Alertas</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map(({ g, alertas, enEtapa, total, libres }) => (
                <TableRow key={g.id} className={cn("group", alertas.some((a) => a.severidad === "danger") && "bg-destructive/5")}>
                  <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-muted/50">
                    <Link href={`/g/${g.id}`} className="font-medium text-foreground hover:text-primary">{g.referencia}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{g.empresa?.nombre ?? "—"}</TableCell>
                  <TableCell><EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} /></TableCell>
                  <TableCell className={cn("text-right", enEtapa != null && enEtapa >= diasFria && "font-semibold text-amber-600")}>
                    {enEtapa ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{total}</TableCell>
                  <TableCell className={cn("text-right", libres != null && libres <= 3 && "font-semibold text-amber-600", libres != null && libres < 0 && "text-destructive")}>
                    {libres ?? "—"}
                  </TableCell>
                  <TableCell>
                    {g.canal_selectivo ? (
                      <span className="inline-flex items-center gap-1.5 text-sm capitalize">
                        <span className="size-2 rounded-full" style={{ backgroundColor: CANAL_COLOR[g.canal_selectivo] }} />
                        {g.canal_selectivo}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {alertas.map((a, i) => (
                        <Badge key={i} variant={a.severidad === "danger" ? "danger" : "warning"}>{a.etiqueta}</Badge>
                      ))}
                      {alertas.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/g/${g.id}`}><Button size="xs" variant="outline">Abrir</Button></Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {ver ? "No hay operaciones que coincidan con el filtro." : "No hay operaciones activas."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Resumen por operador y cliente */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Resumen por operador y cliente</h2>
          <ResumenOperadorCliente grupos={agruparPorOperadorCliente(gestiones)} />
        </div>

        {/* Próximos arribos por ETA */}
        <div className="mt-6">
          <TorreEtas arribos={arribos} />
        </div>

        {/* Predicción de retrasos */}
        <div className="mt-6">
          <TorreRiesgo predicciones={predicciones} />
        </div>

        {/* Tendencias */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Tendencias</h2>
          <TorreTendencias data={tendencias} />
        </div>
      </div>
    </PortalShell>
  )
}
