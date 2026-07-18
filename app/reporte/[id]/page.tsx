import Link from "next/link"
import { ArrowLeft, Ship } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { Timeline } from "@/components/timeline"
import { DatosGestion } from "@/components/datos-gestion"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getGestion, getEventos, getLiquidaciones, getPagos } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { moneda, fecha, fechaHora } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function ReportePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el reporte." />
  const { id } = await params

  const g = await getGestion(id, usuario)
  if (!g) return <div className="p-10 text-center text-sm text-muted-foreground">Gestión no encontrada.</div>

  const [eventos, liquidaciones, pagos, agencia] = await Promise.all([
    getEventos(id, usuario),
    getLiquidaciones(id),
    getPagos(id),
    getConfig("agencia_nombre"),
  ])

  // Resumen financiero por moneda.
  const verif: Record<string, number> = {}
  for (const p of pagos) if (p.estado === "verificado") for (const a of p.aplicaciones ?? []) verif[p.moneda] = (verif[p.moneda] ?? 0) + Number(a.monto_aplicado)
  const totales: Record<string, number> = {}
  for (const liq of liquidaciones)
    if (liq.estado !== "anulada" && liq.estado !== "estimada")
      for (const l of liq.lineas ?? []) if (!l.anulada) totales[l.moneda] = (totales[l.moneda] ?? 0) + Number(l.monto)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href={`/g/${g.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <ImprimirBoton />
        </div>

        {/* Encabezado con marca */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Ship className="size-5" />
            </span>
            <div>
              <p className="text-base font-bold">{agencia ?? "Agencia Aduanera"}</p>
              <p className="text-xs text-slate-500">Reporte de gestión aduanera</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{g.referencia}</p>
            <p className="text-xs text-slate-500">Emitido {fechaHora(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
          <span className="text-sm text-slate-500">{g.empresa?.nombre}</span>
        </div>

        {/* Ficha */}
        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Datos de la carga</h2>
        <DatosGestion g={g} />

        {/* Estado financiero */}
        {Object.keys(totales).length > 0 && (
          <>
            <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Estado financiero</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-slate-500">
                  <th className="py-1">Moneda</th>
                  <th className="py-1 text-right">Total</th>
                  <th className="py-1 text-right">Pagado</th>
                  <th className="py-1 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totales).map(([m, total]) => (
                  <tr key={m} className="border-b border-slate-100">
                    <td className="py-1">{m}</td>
                    <td className="py-1 text-right">{moneda(total, m)}</td>
                    <td className="py-1 text-right">{moneda(verif[m] ?? 0, m)}</td>
                    <td className="py-1 text-right font-semibold">{moneda(total - (verif[m] ?? 0), m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Timeline */}
        <h2 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Historial</h2>
        <Timeline eventos={eventos} />

        <p className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
          {agencia ?? "Agencia Aduanera"} · Documento generado desde la plataforma de seguimiento.
        </p>
      </div>
    </div>
  )
}
