import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { ReportBuilder } from "@/components/report-builder"
import { ReportTable } from "@/components/report-table"
import { ReportesGuardados } from "@/components/reportes-guardados"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { filasReporte } from "@/lib/data/reportes"
import { listarDefiniciones } from "@/lib/data/reportes-guardados"
import { listarRegimenes } from "@/lib/data/regimenes"
import { COLUMNAS_DEFAULT } from "@/lib/reportes"
import { getSupabase } from "@/lib/supabase/server"
import type { Empresa } from "@/lib/types"

export const dynamic = "force-dynamic"

type SP = { cols?: string; empresa?: string; desde?: string; hasta?: string; base?: string; regimen?: string; tipo?: string; documento?: string; producto?: string }

export default async function ReportesAgencia({ searchParams }: { searchParams: Promise<SP> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver reportes." />
  const sp = await searchParams

  const sb = getSupabase()
  const { data: empData } = await sb.from("empresas").select("id, nombre").eq("activo", true).order("nombre")
  const empresas = (empData as Pick<Empresa, "id" | "nombre">[]) ?? []
  const cols = sp.cols?.split(",").filter(Boolean) ?? COLUMNAS_DEFAULT
  const [filas, definiciones, regimenes] = await Promise.all([
    filasReporte(usuario, {
      empresaId: sp.empresa,
      desde: sp.desde,
      hasta: sp.hasta,
      base: (sp.base as "eta" | "solicitud") ?? "eta",
      regimen: sp.regimen,
      tipo: sp.tipo,
      documento: sp.documento,
      producto: sp.producto,
    }),
    listarDefiniciones().catch(() => []),
    listarRegimenes(),
  ])

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Reportes"
          descripcion="Arma una matriz eligiendo columnas, cliente y rango de fechas; expórtala a Excel."
        />
        <div className="mt-6 flex flex-col gap-4">
          <ReportBuilder empresas={empresas} regimenes={regimenes} />
          <ReportesGuardados definiciones={definiciones} />
          <ReportTable filas={filas} cols={cols} />
        </div>
      </div>
    </PortalShell>
  )
}
