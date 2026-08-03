import Link from "next/link"
import { Download, Boxes, CheckCircle2, Clock, FileText } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"

export const dynamic = "force-dynamic"

export default async function ReportesCliente() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver reportes." />
  const gestiones = await listarGestiones(usuario)

  const cerradas = gestiones.filter((g) => g.estado?.tipo === "final")
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Reportes"
          descripcion="El histórico de tus operaciones."
          acciones={
            <a href="/api/export/gestiones" download>
              <Button variant="outline">
                <Download /> Exportar Excel
              </Button>
            </a>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Operaciones totales" value={gestiones.length} icon={Boxes} />
          <StatCard label="Activas" value={activas.length} icon={Clock} />
          <StatCard label="Cerradas" value={cerradas.length} icon={CheckCircle2} tone="success" />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mis gestiones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {gestiones.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{g.referencia}</span>
                  <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/g/${g.id}`}>
                    <Button size="xs" variant="ghost">Ver</Button>
                  </Link>
                  <Link href={`/reporte/${g.id}`}>
                    <Button size="xs" variant="outline">
                      <FileText /> PDF
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {gestiones.length === 0 && <p className="text-sm text-muted-foreground">Sin gestiones.</p>}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
