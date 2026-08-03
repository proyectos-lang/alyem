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
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { diasEnEtapa, diasTotales, diasLibresRestantes, alertasDe } from "@/lib/data/metricas"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const CANAL_COLOR = { verde: "#22c55e", amarillo: "#eab308", rojo: "#ef4444" } as const

export default async function TorreControl({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la torre de control." />
  const { q } = await searchParams

  const [gestiones, diasFriaStr] = await Promise.all([listarGestiones(usuario, { texto: q }), getConfig("dias_gestion_fria")])
  const diasFria = Number(diasFriaStr ?? "4")

  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const filas = activas
    .map((g) => ({ g, alertas: alertasDe(g, diasFria), enEtapa: diasEnEtapa(g), total: diasTotales(g), libres: diasLibresRestantes(g) }))
    .sort((a, b) => b.alertas.length - a.alertas.length || (b.enEtapa ?? 0) - (a.enEtapa ?? 0))

  const conAlertas = filas.filter((f) => f.alertas.length > 0).length
  const canalRojo = activas.filter((g) => g.canal_selectivo === "rojo").length
  const libresPorVencer = filas.filter((f) => f.libres != null && f.libres <= 3).length

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Torre de control"
          descripcion="Vista integral de todas las operaciones activas, sus tiempos y alertas."
        />

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Operaciones activas" value={activas.length} icon={Boxes} />
          <StatCard label="Con alertas" value={conAlertas} icon={TriangleAlert} tone={conAlertas ? "warning" : "default"} />
          <StatCard label="Canal rojo" value={canalRojo} icon={ShieldAlert} tone={canalRojo ? "danger" : "default"} />
          <StatCard label="Días libres por vencer" value={libresPorVencer} icon={Timer} tone={libresPorVencer ? "warning" : "default"} />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Operaciones en curso</h2>
          <Buscador />
        </div>

        <Card className="mt-3 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
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
              {filas.map(({ g, alertas, enEtapa, total, libres }) => (
                <TableRow key={g.id} className={cn(alertas.some((a) => a.severidad === "danger") && "bg-destructive/5")}>
                  <TableCell>
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
              {filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No hay operaciones activas.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PortalShell>
  )
}
