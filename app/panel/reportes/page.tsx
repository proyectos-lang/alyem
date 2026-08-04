import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { ReportBuilder } from "@/components/report-builder"
import { ReportTable } from "@/components/report-table"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { filasReporte } from "@/lib/data/reportes"
import { listarRegimenes } from "@/lib/data/regimenes"
import { COLUMNAS_DEFAULT } from "@/lib/reportes"

export const dynamic = "force-dynamic"

type SP = { cols?: string; desde?: string; hasta?: string; base?: string; regimen?: string; tipo?: string; documento?: string; producto?: string }

export default async function ReportesCliente({ searchParams }: { searchParams: Promise<SP> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver reportes." />
  const sp = await searchParams

  const cols = (sp.cols?.split(",").filter(Boolean) ?? COLUMNAS_DEFAULT)
  const [filas, regimenes] = await Promise.all([
    filasReporte(usuario, {
      desde: sp.desde,
      hasta: sp.hasta,
      base: (sp.base as "eta" | "solicitud") ?? "eta",
      regimen: sp.regimen,
      tipo: sp.tipo,
      documento: sp.documento,
      producto: sp.producto,
    }),
    listarRegimenes(),
  ])

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader titulo="Reportes" descripcion="Arma tu reporte eligiendo columnas y fechas. Los datos son de tu empresa." />
        <div className="mt-6 flex flex-col gap-4">
          <ReportBuilder regimenes={regimenes} />
          <ReportTable filas={filas} cols={cols} />
        </div>
      </div>
    </PortalShell>
  )
}
