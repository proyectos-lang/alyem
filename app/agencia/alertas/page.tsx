import Link from "next/link"
import { TriangleAlert, Timer, ShieldAlert, Clock } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones, getEstadosCatalogo } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { diasEnEtapa, diasLibresRestantes, alertasDe } from "@/lib/data/metricas"

export const dynamic = "force-dynamic"

export default async function AlertasPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver las alertas." />

  const [gestiones, diasFriaStr, estados] = await Promise.all([
    listarGestiones(usuario),
    getConfig("dias_gestion_fria"),
    getEstadosCatalogo(),
  ])
  const diasFria = Number(diasFriaStr ?? "4")
  const slaPorEstado = new Map(estados.map((e) => [e.nombre, e.sla_dias ?? null]))

  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const filas = activas
    .map((g) => ({
      g,
      alertas: alertasDe(g, diasFria, g.estado?.nombre ? slaPorEstado.get(g.estado.nombre) : null),
      enEtapa: diasEnEtapa(g),
      libres: diasLibresRestantes(g),
    }))
    .filter((f) => f.alertas.length > 0)
    .sort(
      (a, b) =>
        b.alertas.filter((x) => x.severidad === "danger").length - a.alertas.filter((x) => x.severidad === "danger").length ||
        b.alertas.length - a.alertas.length,
    )

  const libresVencidos = filas.filter((f) => f.libres != null && f.libres < 0).length
  const libresPorVencer = filas.filter((f) => f.libres != null && f.libres >= 0 && f.libres <= 3).length
  const canalRojo = filas.filter((f) => f.g.canal_selectivo === "rojo").length
  const frias = filas.filter((f) => f.enEtapa != null && f.enEtapa >= diasFria).length

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Alertas" descripcion="Operaciones que requieren atención: días libres, canal rojo y estancamiento." />

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Días libres vencidos" value={libresVencidos} icon={Timer} tone={libresVencidos ? "danger" : "default"} />
          <StatCard label="Días libres por vencer" value={libresPorVencer} icon={Clock} tone={libresPorVencer ? "warning" : "default"} />
          <StatCard label="Canal rojo" value={canalRojo} icon={ShieldAlert} tone={canalRojo ? "danger" : "default"} />
          <StatCard label="Operaciones estancadas" value={frias} icon={TriangleAlert} tone={frias ? "warning" : "default"} />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4" /> Operaciones con alertas
              {filas.length > 0 && <Badge variant="warning">{filas.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {filas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin alertas activas. Todo en orden. ✅</p>
            ) : (
              filas.map(({ g, alertas }) => (
                <Link
                  key={g.id}
                  href={`/g/${g.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {g.referencia} <span className="font-normal text-muted-foreground">· {g.empresa?.nombre}</span>
                    </p>
                    <div className="mt-1">
                      <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {alertas.map((a, i) => (
                      <Badge key={i} variant={a.severidad === "danger" ? "danger" : "warning"}>{a.etiqueta}</Badge>
                    ))}
                    <Button size="xs" variant="outline">Abrir</Button>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
